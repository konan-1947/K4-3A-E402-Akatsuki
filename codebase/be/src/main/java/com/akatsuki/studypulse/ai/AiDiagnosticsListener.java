package com.akatsuki.studypulse.ai;

/** Optional observability hook; implementations can emit metrics without coupling AI calls to a vendor. */
public interface AiDiagnosticsListener {

    AiDiagnosticsListener NO_OP = new AiDiagnosticsListener() { };

    default void onProviderAttempt(String provider) { }

    default void onProviderSucceeded(String provider) { }

    default void onProviderFailed(String provider, String detail) { }
}
