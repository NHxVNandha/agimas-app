package id.agimas.app;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Tombol back HP: tanya aplikasi web dulu (window.agimasBack di app.js).
        // true = sudah kembali ke layar sebelumnya; selain itu (sudah di Beranda) = tutup aplikasi.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() == null || getBridge().getWebView() == null) { finish(); return; }
                getBridge().getWebView().evaluateJavascript(
                    "(function(){try{return !!(window.agimasBack&&window.agimasBack());}catch(e){return false;}})()",
                    value -> { if (!"true".equals(value)) finish(); });
            }
        });
    }
}
