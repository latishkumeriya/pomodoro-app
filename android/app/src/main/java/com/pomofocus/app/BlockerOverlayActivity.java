package com.pomofocus.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * Fullscreen "bounce back" screen shown over other apps when the user
 * leaves during a locked focus session.
 */
public class BlockerOverlayActivity extends Activity {

    public static volatile boolean visible = false;

    private Handler handler;
    private Runnable ticker;
    private TextView timerView;
    private long endAt;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        visible = true;
        endAt = getIntent().getLongExtra("endAt", System.currentTimeMillis());

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(Color.parseColor("#1a0b2e"));
        int pad = (int) (24 * getResources().getDisplayMetrics().density);
        root.setPadding(pad, pad, pad, pad);

        TextView badge = new TextView(this);
        badge.setText("SESSION LOCKED");
        badge.setTextColor(Color.WHITE);
        badge.setTextSize(13);
        badge.setTypeface(null, Typeface.BOLD);
        badge.setGravity(Gravity.CENTER);
        badge.setBackgroundColor(Color.parseColor("#ff4d4d"));
        badge.setPadding(pad / 2, pad / 4, pad / 2, pad / 4);

        TextView title = new TextView(this);
        title.setText("Your focus is waiting");
        title.setTextColor(Color.WHITE);
        title.setTextSize(26);
        title.setTypeface(null, Typeface.BOLD);
        title.setGravity(Gravity.CENTER);

        timerView = new TextView(this);
        timerView.setTextColor(Color.parseColor("#ffd166"));
        timerView.setTextSize(56);
        timerView.setTypeface(null, Typeface.BOLD);
        timerView.setGravity(Gravity.CENTER);

        TextView sub = new TextView(this);
        sub.setText("The guardian is holding your streak.\nGo back before it slips.");
        sub.setTextColor(Color.parseColor("#c9b8e8"));
        sub.setTextSize(15);
        sub.setGravity(Gravity.CENTER);

        Button back = new Button(this);
        back.setText("Return to focus");
        back.setTextColor(Color.parseColor("#451a03"));
        back.setBackgroundColor(Color.parseColor("#ffd166"));
        back.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent i = new Intent(BlockerOverlayActivity.this, MainActivity.class);
                i.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                try {
                    startActivity(i);
                } catch (Exception ignored) {
                }
                finish();
            }
        });

        root.addView(badge);
        root.addView(title);
        root.addView(timerView);
        root.addView(sub);
        root.addView(back);
        setContentView(root);

        handler = new Handler(Looper.getMainLooper());
        ticker = new Runnable() {
            @Override
            public void run() {
                long left = Math.max(0, endAt - System.currentTimeMillis());
                long m = left / 60000L;
                long s = (left / 1000L) % 60L;
                timerView.setText(String.format("%02d:%02d", m, s));
                if (left <= 0) {
                    finish();
                    return;
                }
                handler.postDelayed(this, 1000);
            }
        };
        handler.post(ticker);
    }

    @Override
    protected void onDestroy() {
        visible = false;
        if (handler != null) {
            handler.removeCallbacks(ticker);
        }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        // stay put — return via the button
    }
}
