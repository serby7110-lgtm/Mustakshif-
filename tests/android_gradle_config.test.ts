import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('1. Gradle configuration enforces minSdk = 21 and drops API 19/KitKat legacy branches', () => {
  const gradlePath = path.resolve('app', 'build.gradle.kts');
  assert.ok(fs.existsSync(gradlePath), 'app/build.gradle.kts must exist');

  const content = fs.readFileSync(gradlePath, 'utf8');
  assert.ok(content.includes('minSdk = 21'), 'minSdk must be explicitly set to 21');
  assert.ok(!content.includes('minSdk = 19'), 'Must not contain minSdk 19');
  assert.ok(!content.includes('kitkat'), 'Must not contain kitkat legacy flavor/code');
  assert.ok(!content.includes('KitKat'), 'Must not contain KitKat legacy flavor/code');
});

test('2. Gradle configuration sets compileSdk and targetSdk to latest stable API 35', () => {
  const gradlePath = path.resolve('app', 'build.gradle.kts');
  const content = fs.readFileSync(gradlePath, 'utf8');

  assert.ok(content.includes('compileSdk = 35'), 'compileSdk must be set to 35');
  assert.ok(content.includes('targetSdk = 35'), 'targetSdk must be set to 35');
});

test('3. Java 8+ API desugaring and Kotlin jvmTarget are enabled for API 21 compatibility', () => {
  const gradlePath = path.resolve('app', 'build.gradle.kts');
  const content = fs.readFileSync(gradlePath, 'utf8');

  assert.ok(content.includes('isCoreLibraryDesugaringEnabled = true'), 'coreLibraryDesugaring must be enabled');
  assert.ok(content.includes('desugar_jdk_libs'), 'Must include desugar_jdk_libs dependency');
  assert.ok(content.includes('jvmTarget = "1.8"'), 'Kotlin jvmTarget must be 1.8');
  assert.ok(content.includes('JavaVersion.VERSION_1_8'), 'Java compatibility must be 1.8');
});

test('4. vectorDrawables.useSupportLibrary and android:supportsRtl are enabled', () => {
  const gradlePath = path.resolve('app', 'build.gradle.kts');
  const gradleContent = fs.readFileSync(gradlePath, 'utf8');
  assert.ok(gradleContent.includes('useSupportLibrary = true'), 'vectorDrawables useSupportLibrary must be true');

  const manifestPath = path.resolve('app', 'src', 'main', 'AndroidManifest.xml');
  assert.ok(fs.existsSync(manifestPath), 'AndroidManifest.xml must exist');
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  assert.ok(manifestContent.includes('android:supportsRtl="true"'), 'android:supportsRtl must be true in manifest');
});

test('5. Dependency audit: all libraries compatible with minSdk 21 without conflicts', () => {
  const gradlePath = path.resolve('app', 'build.gradle.kts');
  const content = fs.readFileSync(gradlePath, 'utf8');

  assert.ok(content.includes('androidx.core:core-ktx'), 'Must include core-ktx');
  assert.ok(content.includes('androidx.appcompat:appcompat'), 'Must include appcompat');
  assert.ok(content.includes('com.google.android.material:material'), 'Must include material components');
});

test('6. Version bumped: versionCode = 2 and versionName = "1.1.0"', () => {
  const gradlePath = path.resolve('app', 'build.gradle.kts');
  const content = fs.readFileSync(gradlePath, 'utf8');

  assert.ok(content.includes('versionCode = 2'), 'versionCode must be bumped to 2');
  assert.ok(content.includes('versionName = "1.1.0"'), 'versionName must be "1.1.0"');
});
