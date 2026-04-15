# Timon Rust Module

This directory contains the Timon Rust core, the native bridge files, and the build automation scripts.

## Setup & Prerequisites

### 1. Android NDK (for Android builds)
To build the Rust library for Android, you must have the Android NDK installed.
- **Recommended version**: 21.4.7075529 (or recent LTS).
- Ensure `ANDROID_NDK_HOME` is set in your env, OR ensure `ANDROID_HOME` is set and the NDK is installed under the standard `ndk/` path.
- In your `~/.zshrc` or `~/.bashrc`:
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export ANDROID_NDK_HOME=$ANDROID_HOME/ndk/21.4.7075529
  ```

### 2. Rust Toolchain
Ensure you have `cbindgen` and the necessary targets installed:
```bash
cargo install cbindgen
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

## Running the Build

The build script `scripts/build_all.sh` automates the compilation, header generation, and injection of native files into your target app.

### Targeting your App and Timon Core
By default, the script targets `MyTestApp` within this repository and expects the Timon Rust repository to be in a sibling folder named `timon`.

To override these paths, use the `APP_DIR` and `TIM_DIR` environment variables:

```bash
# From this directory (src/lib/timon)
TIM_DIR=../../../../path-to-rust-core APP_DIR=../../../../your-mobile-app ./scripts/build_all.sh
```

### Build Options
The script should be run **after** performing a standard `npx expo prebuild` in your target app to ensure the `ios/` and `android/` folders exist.


- **Full Build (iOS + Android)**:
  ```bash
  ./scripts/build_all.sh
  ```
- **iOS Only**:
  ```bash
  ./scripts/build_all.sh --ios-only
  ```
- **Android Only**:
  ```bash
  ./scripts/build_all.sh --android-only
  ```

### Post-Build (iOS only)
After running the script for iOS, you may need to register the generated `timon.xcframework` in Xcode. A helper Ruby script is provided in the root `scripts/` folder of the template for this:
```bash
# From the template root
ruby scripts/link_timon_ios.rb
```
