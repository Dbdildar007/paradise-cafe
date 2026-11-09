# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
# ===== Paradise Cafe - R8 / ProGuard release rules =====
# Applied with: minifyEnabled true, shrinkResources true (see build.gradle.snippet)

-optimizationpasses 5
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable   # needed for Crashlytics/Sentry de-obfuscation; upload mapping.txt, never ship it

# Strip native logging calls completely
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
    public static *** wtf(...);
}

# React Native / Hermes / JNI (must be kept)
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * { @com.facebook.proguard.annotations.DoNotStrip *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-dontwarn com.facebook.react.**

# OkHttp / Okio (certificate pinning library builds on it)
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-keep class okhttp3.internal.publicsuffix.PublicSuffixDatabase { *; }

# Keychain / Keystore
-keep class androidx.security.crypto.** { *; }
-keep class com.oblador.keychain.** { *; }

# jail-monkey
-keep class com.gantix.JailMonkey.** { *; }

# Hermes / SoLoader / JNI - never obfuscate these (fixes "libhermes_executor.so not found" style crashes in release)
-keep class com.facebook.soloader.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.react.hermes.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.fabric.** { *; }
-keep class com.facebook.react.runtime.** { *; }
-keepclasseswithmembernames class * { native <methods>; }
