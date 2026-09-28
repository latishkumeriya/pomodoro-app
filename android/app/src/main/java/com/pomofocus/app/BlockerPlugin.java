package com.pomofocus.app;

import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Process;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Bridge for the Forest-style app blocker.
 * JS drives: startWatch / stopWatch. Permissions via system settings intents.
 */
@CapacitorPlugin(name = "Blocker")
public class BlockerPlugin extends Plugin {

    private static final String PREFS = "pomo_blocker";

    @PluginMethod
    public void startWatch(PluginCall call) {
        long endAt = call.getLong("endAt", System.currentTimeMillis() + 25L * 60L * 1000L);
        prefs().edit().putBoolean("blocking", true).putLong("endAt", endAt).apply();
        try {
            Intent i = new Intent(getContext(), BlockerService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(i);
            } else {
                getContext().startService(i);
            }
            JSObject r = new JSObject();
            r.put("started", true);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("service-start-failed", e);
        }
    }

    @PluginMethod
    public void stopWatch(PluginCall call) {
        prefs().edit().putBoolean("blocking", false).apply();
        try {
            getContext().stopService(new Intent(getContext(), BlockerService.class));
        } catch (Exception ignored) {
        }
        JSObject r = new JSObject();
        r.put("stopped", true);
        call.resolve(r);
    }

    @PluginMethod
    public void hasUsageAccess(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", hasUsageAccessSync());
        call.resolve(r);
    }

    @PluginMethod
    public void openUsageSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("open-failed", e);
        }
    }

    @PluginMethod
    public void hasOverlayPermission(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", Settings.canDrawOverlays(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        try {
            Intent i = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("open-failed", e);
        }
    }

    private boolean hasUsageAccessSync() {
        try {
            AppOpsManager ops = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
            int mode = ops.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    getContext().getPackageName());
            return mode == AppOpsManager.MODE_ALLOWED;
        } catch (Exception e) {
            return false;
        }
    }

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
