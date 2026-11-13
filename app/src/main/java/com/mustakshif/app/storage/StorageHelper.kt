package com.mustakshif.app.storage

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream

/**
 * Handles file and media operations with safe scoped storage guards:
 * - Scoped Storage & MediaStore relative paths (API 29+)
 * - App-specific directories fallback (API 21+)
 */
object StorageHelper {

    /**
     * Saves an exported file (such as bookmarks JSON or quest export)
     * using Scoped Storage on API 29+ and internal/external files dir on API 21-28.
     */
    fun saveExportFile(
        context: Context,
        fileName: String,
        mimeType: String,
        content: ByteArray
    ): Uri? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Android 10+ (API 29+) Scoped Storage via MediaStore
            val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Mustakshif")
            }

            val resolver = context.contentResolver
            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
            uri?.let { targetUri ->
                resolver.openOutputStream(targetUri)?.use { outputStream ->
                    outputStream.write(content)
                }
            }
            uri
        } else {
            // Android 5.0 - 9.0 (API 21 - 28) safe app-specific external storage (no dangerous runtime permission required)
            val baseDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: context.filesDir
            val targetFile = File(baseDir, fileName)
            FileOutputStream(targetFile).use { outputStream ->
                outputStream.write(content)
            }
            Uri.fromFile(targetFile)
        }
    }
}
