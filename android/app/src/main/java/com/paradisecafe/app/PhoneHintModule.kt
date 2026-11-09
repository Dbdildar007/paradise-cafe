package com.paradisecafe.app

import android.app.Activity
import android.content.Intent
import android.content.IntentSender
import androidx.activity.result.IntentSenderRequest
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest
import com.google.android.gms.auth.api.identity.Identity

class PhoneHintModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var promise: Promise? = null

    init {
        reactContext.addActivityEventListener(object : ActivityEventListener {
            override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
                if (requestCode == 2026 && promise != null) {
                    val currentPromise = promise
                    promise = null
                    if (resultCode == Activity.RESULT_OK && data != null) {
                        try {
                            val phoneNumber = Identity.getSignInClient(reactContext).getPhoneNumberFromIntent(data)
                            currentPromise?.resolve(phoneNumber)
                        } catch (e: Exception) {
                            currentPromise?.resolve(null)
                        }
                    } else {
                        currentPromise?.resolve(null)
                    }
                }
            }
            override fun onNewIntent(intent: Intent?) {}
        })
    }

    override fun getName() = "PhoneHintModule"

    @ReactMethod
    fun requestPhoneNumber(promise: Promise) {
        this.promise = promise
        val activity = currentActivity
        if (activity == null) {
            promise.resolve(null)
            return
        }

        val requestHintIntentRequest = GetPhoneNumberHintIntentRequest.builder().build()
        Identity.getSignInClient(activity)
            .getPhoneNumberHintIntent(requestHintIntentRequest)
            .addOnSuccessListener { pendingIntent ->
                try {
                    val intentSenderRequest = IntentSenderRequest.Builder(pendingIntent.intentSender).build()
                    activity.startIntentSenderForResult(intentSenderRequest.intentSender, 2026, null, 0, 0, 0, null)
                } catch (e: IntentSender.SendIntentException) {
                    promise.resolve(null)
                }
            }
            .addOnFailureListener {
                promise.resolve(null)
            }
    }
}

class PhoneHintPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(PhoneHintModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}