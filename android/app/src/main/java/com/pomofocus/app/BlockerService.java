package com.pomofocus.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.util.List;

/**
 * Watches the foreground app once per second while a locked session runs.
 * If the user leaves Pomo, throws up BlockerOverlayActivity to bounce them back.
 */
public class BlockerService extends Service {

    private static final String PREFS = "pomo_blocker";
    private static final String CHANNEL = "pomo_guard";
    private static final int NOTIF_ID = 77;

    private Handler handler;
    private Runnable tick;

    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
        tick = new Runnable() {
            @Override
            public void run() {
                try {
                    poll();
                } catch (Exception ignored) {
                }
                handler.postDelayed(this, 1000);
            }
        };
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startAsForeground();
        handler.removeCallbacks(tick);
        handler.post(tick);
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(tick);
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void poll() {
        SharedPreferences p = getSharedPreferences(PREFS, MODE_PRIVATE);
        boolean blocking = p.getBoolean("blocking", false);
        long endAt = p.getLong("endAt", 0);
        if (!blocking || System.currentTimeMillis() > endAt) {
            if (blocking) {
                p.edit().putBoolean("blocking", false).apply();
            }
            stopSelf();
            return;
        }
        String front = foregroundPackage();
        String mine = getPackageName();
        if (front == null || front.equals(mine) || front.equals("com.android.systemui")) {
            return;
        }
        if (BlockerOverlayActivity.visible) {
            return;
        }
        Intent i = new Intent(this, BlockerOverlayActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        i.putExtra("endAt", endAt);
        try {
            startActivity(i);
        } catch (Exception ignored) {
        }
    }

    private String foregroundPackage() {
        try {
            UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
            long now = System.currentTimeMillis();
            List<UsageStats> stats = usm.queryUsageStats(
                    UsageStatsManager.INTERVAL_DAILY, now - 10_000L, now);
            if (stats == null || stats.isEmpty()) {
                return null;
            }
            UsageStats recent = null;
            for (UsageStats s : stats) {
                if (recent == null || s.getLastTimeUsed() > recent.getLastTimeUsed()) {
                    recent = s;
                }
            }
            return recent != null ? recent.getPackageName() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private void startAsForeground() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                NotificationChannel ch = new NotificationChannel(
                        CHANNEL, "Focus guard", NotificationManager.IMPORTANCE_LOW);
                nm.createNotificationChannel(ch);
            }
            Intent open = new Intent(this, MainActivity.class);
            PendingIntent pi = PendingIntent.getActivity(
                    this, 0, open,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            Notification n = new NotificationCompat.Builder(this, CHANNEL)
                    .setContentTitle("Pomo guard active")
                    .setContentText("Return to your focus session")
                    .setSmallIcon(android.R.drawable.ic_lock_lock)
                    .setContentIntent(pi)
                    .setOngoing(true)
                    .build();
            startForeground(NOTIF_ID, n);
        } catch (Exception ignored) {
            // notification permission denied on some builds — keep polling best-effort
        }
    }
}
