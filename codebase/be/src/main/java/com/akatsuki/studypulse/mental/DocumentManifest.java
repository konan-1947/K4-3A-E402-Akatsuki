package com.akatsuki.studypulse.mental;

public record DocumentManifest(
        String documentId,
        String fileName,
        String mediaType,
        String checksum,
        long size
) { }
