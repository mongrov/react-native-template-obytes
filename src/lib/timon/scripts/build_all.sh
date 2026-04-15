#!/bin/bash
# =============================================================================
# build_all.sh
# Builds the Timon Rust library for iOS and (optionally) Android.
#
# iOS:   Compiles all 3 iOS targets, generates timon.h, packages xcframework.
# Android: Compiles 4 ABI targets (arm64-v8a, armeabi-v7a, x86, x86_64),
#          generates timon.h with JNI symbols, and copies .so files into the
#          app's android/src/main/jniLibs/ directory.
#
# Usage (usually from src/lib/timon):
#   ./scripts/build_all.sh
#
# Environment Overrides:
#   TIM_DIR=../path-to-rust-repo ./scripts/build_all.sh
#   APP_DIR=../path-to-app-repo  ./scripts/build_all.sh
# =============================================================================

set -e

# THIS_DIR is src/lib/timon/scripts/
THIS_DIR="$(cd "$(dirname "$0")" && pwd)"
# LIB_DIR is src/lib/timon/
LIB_DIR="$(cd "$THIS_DIR/.." && pwd)"

# ── Resolve Timon repo directory (Rust source) ───────────────────────────────
# Default to a sibling "timon" directory relative to the template root
DEFAULT_TIM_DIR="$(cd "$LIB_DIR/../../../" 2>/dev/null && pwd)/timon"
TIM_BASE="${TIM_DIR:-$DEFAULT_TIM_DIR}"

if [ ! -d "$TIM_BASE" ]; then
  echo "ERROR: Timon Rust source not found at $TIM_BASE"
  echo "Please set TIM_DIR environment variable to the correct path."
  exit 1
fi

LIB_NAME="libtsdb_timon"
HEADERS_DIR="$TIM_BASE/include"

# ── Resolve app directory ───────────────────────────────────────────────────
# Default to MyTestApp within the template
DEFAULT_APP_PATH="$(cd "$LIB_DIR/../../../MyTestApp" 2>/dev/null && pwd)"
APP_BASE="${APP_DIR:-$DEFAULT_APP_PATH}"

APP_IOS_DIR="$APP_BASE/ios"
APP_NAME=$(basename "$APP_BASE")
APP_NATIVE_DIR="$APP_IOS_DIR/$APP_NAME"
APP_ANDROID_JNILIBS="$APP_BASE/android/app/src/main/jniLibs"

# ── Parse flags ───────────────────────────────────────────────────────────────
BUILD_IOS=true
BUILD_ANDROID=true
for arg in "$@"; do
  case $arg in
    --ios-only)    BUILD_ANDROID=false ;;
    --android-only) BUILD_IOS=false ;;
  esac
done

cd "$TIM_BASE"

# ── Step 1: Ensure cbindgen is installed ─────────────────────────────────────
echo "→ Checking cbindgen..."
if ! command -v cbindgen &>/dev/null; then
  echo "  cbindgen not found — installing via cargo..."
  cargo install cbindgen
fi
echo "  cbindgen: $(cbindgen --version)"

mkdir -p "$HEADERS_DIR"

# =============================================================================
# iOS Build
# =============================================================================
if [ "$BUILD_IOS" = true ]; then
  echo ""
  echo "════════════════════════════════════════════"
  echo "  iOS Build"
  echo "════════════════════════════════════════════"

  # Step 2: Generate clean iOS header (no JNI symbols)
  echo "→ Generating include/timon.h for iOS (aarch64-apple-ios target)..."
  TARGET=aarch64-apple-ios cbindgen \
    --config "$THIS_DIR/cbindgen.toml" \
    --crate tsdb_timon \
    --output "$HEADERS_DIR/timon.h"

  # Safety net: strip any JNI lines that sneak through
  if grep -q 'JNIEnv\|jstring\|JClass\|JString\|jint\|JavaVM\|JObject\|JNI_OnLoad' "$HEADERS_DIR/timon.h"; then
    echo "  ⚠ JNI symbols detected — stripping from iOS header..."
    grep -v 'JNIEnv\|jstring\|JClass\|JString\|jint\|JavaVM\|JObject\|JNI_OnLoad' \
      "$HEADERS_DIR/timon.h" > "$HEADERS_DIR/timon.h.clean"
    mv "$HEADERS_DIR/timon.h.clean" "$HEADERS_DIR/timon.h"
    echo "  ✓ JNI symbols removed from iOS header"
  fi
  echo "  Generated: $HEADERS_DIR/timon.h"

  # Step 3: Install iOS Rust targets
  echo "→ Ensuring iOS Rust targets are installed..."
  rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim

  # Step 4: Compile for all iOS targets
  echo "→ Building aarch64-apple-ios (real device)..."
  IPHONEOS_DEPLOYMENT_TARGET=15.1 cargo build --target aarch64-apple-ios --release

  echo "→ Building x86_64-apple-ios (Simulator x86_64)..."
  IPHONEOS_DEPLOYMENT_TARGET=15.1 cargo build --target x86_64-apple-ios --release

  echo "→ Building aarch64-apple-ios-sim (Simulator ARM64)..."
  IPHONEOS_DEPLOYMENT_TARGET=15.1 cargo build --target aarch64-apple-ios-sim --release

  # Step 5: Fat simulator binary
  echo "→ Creating simulator fat binary (x86_64 + arm64-sim)..."
  mkdir -p target/universal-sim
  lipo -create \
    "target/x86_64-apple-ios/release/${LIB_NAME}.a" \
    "target/aarch64-apple-ios-sim/release/${LIB_NAME}.a" \
    -output "target/universal-sim/${LIB_NAME}.a"

  # Step 6: Package xcframework
  echo "→ Packaging timon.xcframework..."
  rm -rf timon.xcframework
  xcodebuild -create-xcframework \
    -library "target/aarch64-apple-ios/release/${LIB_NAME}.a" \
    -headers "$HEADERS_DIR" \
    -library "target/universal-sim/${LIB_NAME}.a" \
    -headers "$HEADERS_DIR" \
    -output timon.xcframework
  echo "  Created: timon.xcframework"

  # Step 7: Copy to app
  if [ -d "$APP_IOS_DIR" ]; then
    echo "→ Copying timon.xcframework → $APP_IOS_DIR/"
    rm -rf "$APP_IOS_DIR/timon.xcframework"
    cp -R timon.xcframework "$APP_IOS_DIR/timon.xcframework"
    echo "→ Copying timon.h → $APP_NATIVE_DIR/"
    mkdir -p "$APP_NATIVE_DIR"
    cp "$HEADERS_DIR/timon.h" "$APP_NATIVE_DIR/timon.h"
    echo "  ✓ iOS files copied to app"
  else
    echo "  ⚠ iOS app dir not found at $APP_IOS_DIR — skipping copy (run expo prebuild first)"
  fi

  echo ""
  echo "✅ iOS build complete!"
  echo "   xcframework : timon.xcframework"
  echo "   timon.h     : $HEADERS_DIR/timon.h"
fi

# =============================================================================
# Android Build
# =============================================================================
if [ "$BUILD_ANDROID" = true ]; then
  echo ""
  echo "════════════════════════════════════════════"
  echo "  Android Build"
  echo "════════════════════════════════════════════"

  # Detect NDK
  NDK_HOME="${ANDROID_NDK_HOME:-${ANDROID_HOME}/ndk-bundle}"
  if [ ! -d "$NDK_HOME" ]; then
    # Try finding any installed NDK version
    if [ -n "$ANDROID_HOME" ] && [ -d "$ANDROID_HOME/ndk" ]; then
      NDK_HOME=$(ls -d "$ANDROID_HOME/ndk"/*/ 2>/dev/null | head -1)
    fi
  fi

  if [ -z "$NDK_HOME" ] || [ ! -d "$NDK_HOME" ]; then
    echo "  ⚠ Android NDK not found (set ANDROID_NDK_HOME to enable Android builds)"
    echo "  ⚠ Skipping Android build."
  else
    echo "  NDK: $NDK_HOME"

    # Generate Android JNI header (includes JNI symbols)
    echo "→ Generating include/timon_android.h for Android (aarch64-linux-android target)..."
    TARGET=aarch64-linux-android cbindgen \
      --config "$THIS_DIR/cbindgen.toml" \
      --crate tsdb_timon \
      --output "$HEADERS_DIR/timon_android.h"
    echo "  Generated: $HEADERS_DIR/timon_android.h"

    # Install Android Rust targets
    echo "→ Ensuring Android Rust targets are installed..."
    rustup target add \
      aarch64-linux-android \
      armv7-linux-androideabi \
      i686-linux-android \
      x86_64-linux-android

    # Expose NDK compilers (clang) to PATH so cc-rs can find them natively
    NDK_BIN="$NDK_HOME/toolchains/llvm/prebuilt/$(uname -s | tr '[:upper:]' '[:lower:]')-x86_64/bin"
    export PATH="$NDK_BIN:$PATH"

    # Build each Android ABI
    ANDROID_TARGETS=(
      "aarch64-linux-android:arm64-v8a"
      "armv7-linux-androideabi:armeabi-v7a"
      "i686-linux-android:x86"
      "x86_64-linux-android:x86_64"
    )

    for target_pair in "${ANDROID_TARGETS[@]}"; do
      RUST_TARGET="${target_pair%%:*}"
      ABI_NAME="${target_pair##*:}"
      echo "→ Building $RUST_TARGET ($ABI_NAME)..."

      # Resolve NDK linker for the target
      LINKER="$NDK_HOME/toolchains/llvm/prebuilt/$(uname -s | tr '[:upper:]' '[:lower:]')-x86_64/bin/$(echo $RUST_TARGET | sed 's/armv7-linux-androideabi/armv7a-linux-androideabi/')21-clang"

      # Synthesize the Cargo target variable (e.g. CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER)
      ENV_TARGET=$(echo "$RUST_TARGET" | tr '[:lower:]-' '[:upper:]_')
      CC_TARGET=$(echo "$RUST_TARGET" | sed 's/-/_/g')
      
      export "CARGO_TARGET_${ENV_TARGET}_LINKER"="$LINKER"
      export "CC_${CC_TARGET}"="$LINKER"
      export "CXX_${CC_TARGET}"="${LINKER}++"

      cargo build --target "$RUST_TARGET" --release
      echo "  ✓ Built $ABI_NAME"

      # Copy .so into jniLibs
      SO_SRC="$TIM_BASE/target/$RUST_TARGET/release/${LIB_NAME}.so"
      if [ -f "$SO_SRC" ]; then
        DEST_DIR="$APP_ANDROID_JNILIBS/$ABI_NAME"
        mkdir -p "$DEST_DIR"
        cp "$SO_SRC" "$DEST_DIR/${LIB_NAME}.so"
        echo "  ✓ Copied $ABI_NAME → $DEST_DIR/"
      else
        echo "  ⚠ $SO_SRC not found — was the crate-type set to cdylib?"
      fi
    done

    echo ""
    echo "✅ Android build complete!"
    echo "   JNI libs: $APP_ANDROID_JNILIBS"
    echo ""
    echo "→ Injecting Timon Kotlin bridge..."
    ZIVA_APP_SRC="$LIB_DIR/bridge/android"
    MAIN_APP_PATH=$(find "$APP_BASE/android/app/src/main/java" -name "MainApplication.kt" | head -n 1)
    if [ -f "$MAIN_APP_PATH" ]; then
      DEST_JAVA_DIR=$(dirname "$MAIN_APP_PATH")
      APP_PACKAGE=$(grep -o '^package .*' "$MAIN_APP_PATH" | awk '{print $2}')
      
      cp "$ZIVA_APP_SRC/TimonModule.kt" "$DEST_JAVA_DIR/"
      cp "$ZIVA_APP_SRC/TimonPackage.kt" "$DEST_JAVA_DIR/"
      
      # Update package declaration
      sed -i '' "s/^package .*/package $APP_PACKAGE/" "$DEST_JAVA_DIR/TimonModule.kt"
      sed -i '' "s/^package .*/package $APP_PACKAGE/" "$DEST_JAVA_DIR/TimonPackage.kt"
      
      # Inject into MainApplication.kt
      if ! grep -q "TimonPackage()" "$MAIN_APP_PATH"; then
        if grep -q "// add(MyReactNativePackage())" "$MAIN_APP_PATH"; then
          sed -i '' 's|// add(MyReactNativePackage())|add(TimonPackage())|' "$MAIN_APP_PATH"
        elif grep -q "PackageList(this).packages.apply" "$MAIN_APP_PATH"; then
          sed -i '' -e '/PackageList(this).packages.apply/a\'$'\n''              add(TimonPackage())' "$MAIN_APP_PATH"
        fi
        echo "  ✓ Injected TimonPackage into MainApplication.kt"
      fi
      
      echo "  ✓ Kotlin bridge copied to $DEST_JAVA_DIR"
    else
      echo "  ⚠ MainApplication.kt not found in $APP_BASE, cannot copy Kotlin files."
    fi

  fi
fi

echo ""
echo "🎉 All builds complete — run link_timon_ios.rb next for iOS Xcode registration."
