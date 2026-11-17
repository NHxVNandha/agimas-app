package id.agimas.app;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Pembaruan di dalam aplikasi: unduh APK terbaru dengan progres, lalu buka layar pasang Android.
 * Android selalu meminta konfirmasi pengguna untuk memasang (aplikasi di luar Play Store tidak bisa memasang diam-diam),
 * dan sekali saja izin "Pasang aplikasi tak dikenal" untuk Agi Mas (Android 8+).
 * Dipanggil dari web/app.js lewat Capacitor.nativePromise / nativeCallback("AppUpdate", ...).
 */
@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {
    // Hanya mengunduh dari situs Agi Mas sendiri.
    private static final String ALLOWED = "https://solusiagimas.netlify.app/";
    private volatile boolean busy = false;

    private boolean allowed() {
        return Build.VERSION.SDK_INT < 26 || getContext().getPackageManager().canRequestPackageInstalls();
    }

    @PluginMethod
    public void canInstall(PluginCall call) {
        JSObject r = new JSObject();
        r.put("allowed", allowed());
        call.resolve(r);
    }

    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 26) {
            Intent i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
            getActivity().startActivity(i);
        }
        call.resolve();
    }

    /** Callback berulang: {loaded, total} selama mengunduh, lalu {done: true} saat layar pasang dibuka. */
    @PluginMethod(returnType = PluginMethod.RETURN_CALLBACK)
    public void download(PluginCall call) {
        String url = call.getString("url", "");
        if (!url.startsWith(ALLOWED)) { call.reject("Alamat unduhan tidak diizinkan"); return; }
        if (busy) { call.reject("Sedang mengunduh"); return; }
        busy = true;
        call.setKeepAlive(true);
        new Thread(() -> {
            try {
                // Android 6 (API 23) hanya bisa memasang dari file://, jadi file ditaruh di folder yang bisa dibaca pemasang.
                File dir = Build.VERSION.SDK_INT < 24 ? getContext().getExternalFilesDir(null) : getContext().getCacheDir();
                File apk = new File(dir, "agimas-update.apk");
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setConnectTimeout(15000);
                c.setReadTimeout(30000);
                c.setRequestProperty("Cache-Control", "no-cache");
                // Tanpa ini Netlify mengirim gzip tanpa ukuran file, jadi persen progres tidak bisa dihitung.
                c.setRequestProperty("Accept-Encoding", "identity");
                if (c.getResponseCode() != 200) throw new Exception("Server menjawab " + c.getResponseCode());
                long total = c.getContentLength(), loaded = 0, lastSent = -1;
                try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(apk)) {
                    byte[] buf = new byte[32768];
                    int n;
                    while ((n = in.read(buf)) > 0) {
                        out.write(buf, 0, n);
                        loaded += n;
                        long step = total > 0 ? loaded * 100 / total : loaded / 262144; // per persen, atau per 256 KB bila ukuran tak diketahui
                        if (step != lastSent) {
                            lastSent = step;
                            JSObject p = new JSObject();
                            p.put("loaded", loaded);
                            p.put("total", total);
                            call.resolve(p);
                        }
                    }
                } finally {
                    c.disconnect();
                }
                if (total > 0 && loaded != total) throw new Exception("Unduhan terputus");

                // Pastikan file benar APK Agi Mas dengan versi lebih baru (tanda tangan diperiksa Android saat memasang).
                PackageInfo got = getContext().getPackageManager().getPackageArchiveInfo(apk.getPath(), 0);
                PackageInfo cur = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
                if (got == null || !getContext().getPackageName().equals(got.packageName)) throw new Exception("File unduhan bukan aplikasi Agi Mas");
                if (got.versionCode <= cur.versionCode) throw new Exception("Versi di server tidak lebih baru");

                Uri uri = Build.VERSION.SDK_INT < 24
                    ? Uri.fromFile(apk)
                    : FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apk);
                Intent i = new Intent(Intent.ACTION_VIEW)
                    .setDataAndType(uri, "application/vnd.android.package-archive")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                getActivity().startActivity(i);
                JSObject d = new JSObject();
                d.put("done", true);
                call.resolve(d);
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : "Gagal mengunduh");
            } finally {
                busy = false;
                call.setKeepAlive(false);
            }
        }).start();
    }
}
