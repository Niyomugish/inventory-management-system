import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { 
  ScanBarcode, 
  Search, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  CameraOff, 
  Volume2, 
  Tag, 
  RefreshCw 
} from "lucide-react";

// Web Audio API beep sound generator
function playBeep(success = true) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (success) {
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (err) {
    // Audio context may be restricted before user interaction
  }
}

function extractProductCode(payload) {
  const rawValue = String(payload || "").trim();
  if (!rawValue) return "";

  if (rawValue.startsWith("{")) {
    try {
      const parsed = JSON.parse(rawValue);
      const code = parsed.sku || parsed.barcode || parsed.code;
      if (typeof code === "string" || typeof code === "number") {
        return String(code).trim();
      }
    } catch (err) {
      // A non-JSON QR payload can still be a product SKU.
    }
  }

  try {
    const url = new URL(rawValue);
    const code = url.searchParams.get("sku") || url.searchParams.get("barcode") || url.searchParams.get("code");
    if (code) return code.trim();
  } catch (err) {
    // Product codes are not necessarily URLs.
  }

  return rawValue.replace(/^(?:sku|barcode)\s*[:=]\s*/i, "").trim();
}

export default function PriceCheckerPage({ onBack }) {
  const [skuInput, setSkuInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [error, setError] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [catalogError, setCatalogError] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);

  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const scannerControlsRef = useRef(null);
  const scanLockedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();

    api.getScanCatalog()
      .then(items => setCatalog(items))
      .catch((err) => {
        setCatalogError(err.message || "Unable to load the product catalog.");
      });
  }, []);

  useEffect(() => {
    if (!isCameraActive || !videoRef.current) return undefined;

    let cancelled = false;
    import("@zxing/browser").then(({ BrowserQRCodeReader }) => {
      if (cancelled) return;

      const reader = new BrowserQRCodeReader();
      return reader.decodeFromConstraints(
        {
          audio: false,
          video: { facingMode: { ideal: "environment" } }
        },
        videoRef.current,
        (result, _scanError, controls) => {
          if (!result || scanLockedRef.current) return;

          scanLockedRef.current = true;
          controls.stop();
          scannerControlsRef.current = null;
          setIsCameraActive(false);
          handleLookup(result.getText());
        }
      ).then((controls) => {
        if (cancelled) {
          controls.stop();
        } else {
          scannerControlsRef.current = controls;
        }
      });
    }).catch((err) => {
      if (!cancelled) {
        setIsCameraActive(false);
        setError("Unable to start the camera. Check camera permissions and use HTTPS or localhost.");
      }
    });

    return () => {
      cancelled = true;
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
    };
  }, [isCameraActive]);

  const handleLookup = async (skuToScan) => {
    const targetSku = extractProductCode(skuToScan || skuInput);
    if (!targetSku) return;

    setLoading(true);
    setError("");

    try {
      const data = await api.checkPrice(targetSku);
      setScannedProduct(data);
      playBeep(true);
      setSkuInput("");
    } catch (err) {
      setScannedProduct(null);
      setError(err.message || `No product found for barcode "${targetSku}".`);
      playBeep(false);
    } finally {
      setLoading(false);
      // Keep input focused for next scan
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLookup();
  };

  const startCamera = async () => {
    setError("");
    scanLockedRef.current = false;
    setIsCameraActive(true);
  };

  const stopCamera = () => {
    scanLockedRef.current = true;
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    setIsCameraActive(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Kiosk Bar */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <ScanBarcode className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white text-base tracking-tight">Price Checker & Scanner</span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Retail & Floor Kiosk
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Audio Chime Ready</span>
            </div>
            {isCameraActive ? (
              <button
                onClick={stopCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all shadow-sm"
              >
                <CameraOff className="w-4 h-4" />
                <span>Stop Camera</span>
              </button>
            ) : (
              <button
                onClick={startCamera}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-all border border-slate-600 shadow-sm"
              >
                <Camera className="w-4 h-4 text-blue-400" />
                <span>Scan QR Code</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Kiosk Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {/* Scanner Input Card */}
        <div className="bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl shadow-black/50">
          
          {/* Camera Scanner Viewport (if activated) */}
          {isCameraActive && (
            <div className="mb-6 relative rounded-2xl overflow-hidden bg-black border-2 border-blue-500 max-w-md mx-auto aspect-video flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {/* Target scanner crosshair */}
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-20 border-2 border-emerald-400 rounded-lg bg-emerald-500/10 pointer-events-none flex items-center justify-center">
                <div className="w-full h-0.5 bg-rose-500 shadow-lg shadow-rose-500/80 animate-pulse"></div>
              </div>
              <span className="absolute bottom-2 text-[11px] bg-black/60 px-2 py-0.5 rounded text-slate-200">
                Align the product QR code within the box
              </span>
            </div>
          )}

          {/* Barcode Search Form */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <ScanBarcode className="w-6 h-6 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Scan a product QR code or enter SKU..."
                  value={skuInput}
                  onChange={(e) => setSkuInput(e.target.value)}
                  className="w-full pl-13 pr-4 py-4 rounded-2xl bg-slate-900 border-2 border-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-white text-lg placeholder-slate-500 outline-none transition-all uppercase tracking-wider font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !skuInput.trim()}
                className="px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 text-white font-bold text-base shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 flex-shrink-0"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                <span className="hidden sm:inline">Lookup Price</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <span>💡 QR codes should contain the product SKU. USB / Bluetooth barcode scanners also work.</span>
            </p>
          </form>

          {/* Error Banner */}
          {error && (
            <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Scan / Lookup Problem</p>
                <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Scanned Product Display Card */}
          {scannedProduct && (
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border-2 border-emerald-500/50 p-6 sm:p-8 shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left: Product Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-mono font-bold tracking-wider uppercase">
                      SKU: {scannedProduct.sku}
                    </span>
                    {scannedProduct.category && (
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium">
                        {scannedProduct.category}
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {scannedProduct.name}
                  </h2>

                  {/* Stock Availability */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      scannedProduct.stock === 0
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : scannedProduct.stock_status === "Low Stock"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{scannedProduct.stock_status}</span>
                      <span className="text-slate-400 font-normal">({scannedProduct.stock} in inventory)</span>
                    </span>
                  </div>
                </div>

                {/* Right: Price Tag */}
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6 text-center md:text-right flex-shrink-0 shadow-inner">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Official Retail Price
                  </span>
                  <div className="text-4xl sm:text-5xl font-extrabold text-emerald-400 tracking-tight font-mono">
                    ${Number(scannedProduct.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Tax included / Item #{scannedProduct.id}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick-Scan Sample Catalog */}
          <div className="mt-8 pt-6 border-t border-slate-700/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3">
              Quick Test / Floor Catalog (Click SKU to simulate barcode scan):
            </span>
            {catalogError && (
              <p className="mb-3 text-xs text-rose-300">{catalogError}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {catalog.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLookup(item.sku)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 transition-all active:scale-95 group"
                >
                  <Tag className="w-3 h-3 text-blue-400 group-hover:text-blue-300" />
                  <span className="font-bold">{item.sku}</span>
                  <span className="text-slate-400">({item.name})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-800">
        <span>StockFlow Price Scanner Kiosk • Designed for Purchasers and Employees</span>
      </footer>
    </div>
  );
}
