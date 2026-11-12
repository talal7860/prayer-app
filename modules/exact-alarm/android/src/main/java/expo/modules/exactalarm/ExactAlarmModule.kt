package expo.modules.exactalarm

import android.app.AlarmManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Android 12+ "Alarms & reminders" access (SCHEDULE_EXACT_ALARM). Without it, scheduled
 * notifications (the adhan) and the widget's re-render alarm can fire tens of minutes late.
 * Android 14+ doesn't grant it to new installs, so the app asks.
 */
class ExactAlarmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExactAlarm")

    /** True when exact alarms are allowed (always before Android 12). */
    Function("canScheduleExactAlarms") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        return@Function true
      }
      val context = appContext.reactContext ?: return@Function true
      val alarmManager = context.getSystemService(AlarmManager::class.java) ?: return@Function true
      alarmManager.canScheduleExactAlarms()
    }

    /** Opens this app's "Alarms & reminders" switch. Returns false where there's none. */
    Function("openSettings") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        return@Function false
      }
      val context = appContext.currentActivity ?: appContext.reactContext ?: return@Function false
      val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${context.packageName}"))
      if (context !is android.app.Activity) {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      runCatching { context.startActivity(intent) }.isSuccess
    }
  }
}
