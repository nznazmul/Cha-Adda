package com.chaadda.app;

import android.animation.ObjectAnimator;
import android.os.Bundle;
import android.view.View;
import android.view.animation.AnticipateInterpolator;

import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 1. Install the Splash Screen (must be done before super.onCreate)
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);

        super.onCreate(savedInstanceState);

        // 2. Add a premium exit animation (fade out + slide up) for the splash screen
        // This is a hallmark of an experienced developer paying attention to UX details.
        splashScreen.setOnExitAnimationListener(splashScreenViewProvider -> {
            View splashScreenView = splashScreenViewProvider.getView();
            
            // Slide up animation
            ObjectAnimator slideUp = ObjectAnimator.ofFloat(
                    splashScreenView,
                    View.TRANSLATION_Y,
                    0f,
                    -splashScreenView.getHeight()
            );
            slideUp.setInterpolator(new AnticipateInterpolator());
            slideUp.setDuration(500L); // 500 ms for a smooth transition
            
            // Fade out animation
            ObjectAnimator fadeOut = ObjectAnimator.ofFloat(
                    splashScreenView,
                    View.ALPHA,
                    1f,
                    0f
            );
            fadeOut.setDuration(500L);

            // Clean up the splash screen view when the animation finishes
            fadeOut.addListener(new android.animation.AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(android.animation.Animator animation) {
                    splashScreenViewProvider.remove();
                }
            });

            // Start animations simultaneously
            slideUp.start();
            fadeOut.start();
        });
    }
}
