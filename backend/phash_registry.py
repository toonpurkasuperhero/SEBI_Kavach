import imagehash
from PIL import Image
import io
import os
from typing import Tuple, Optional, List, Dict

class PHashRegistry:
    def __init__(self):
        # In-memory store of official registered media perceptual hashes
        # In production, this can be backed by PostgreSQL + pgvector
        self.registry: List[Dict] = []
        self._seed_default_official_hashes()

    def _seed_default_official_hashes(self):
        """Seed registry with sample official circular/announcement hashes."""
        # Seed placeholder hashes for NSE Official Circulars and SEBI Press Releases
        self.registry.append({
            "hash": imagehash.hex_to_hash("a1b2c3d4e5f60718"),
            "signer": "SEBI Official Press Bureau",
            "title": "SEBI Master Circular on Cyber Security 2026",
            "timestamp": "2026-08-01T10:00:00Z"
        })
        self.registry.append({
            "hash": imagehash.hex_to_hash("0f1e2d3c4b5a6978"),
            "signer": "NSE Investor Relations",
            "title": "NSE Official Board Resolution Notice",
            "timestamp": "2026-08-02T14:30:00Z"
        })

    def register_media(self, image_input: Image.Image, signer: str, title: str) -> str:
        """Register an official media file by computing its perceptual hash."""
        p_hash = imagehash.phash(image_input)
        entry = {
            "hash": p_hash,
            "signer": signer,
            "title": title,
            "timestamp": "2026-08-03T12:00:00Z"
        }
        self.registry.append(entry)
        return str(p_hash)

    def match_media(self, image_input: Image.Image, threshold: int = 6) -> Tuple[bool, Optional[str], Optional[str], int]:
        """
        Check if an inbound compressed/re-encoded image matches any registered official media.
        Returns: (is_matched, signer_name, title, lowest_hamming_distance)
        """
        try:
            inbound_hash = imagehash.phash(image_input)
            best_match = None
            min_distance = 999

            for entry in self.registry:
                distance = inbound_hash - entry["hash"]  # Hamming distance
                if distance < min_distance:
                    min_distance = distance
                    best_match = entry

            if min_distance <= threshold and best_match:
                return True, best_match["signer"], best_match["title"], min_distance

            return False, None, None, min_distance
        except Exception as e:
            print(f"[pHash Engine] Error matching media: {e}")
            return False, None, None, 999

# Global Singleton Instance
phash_registry = PHashRegistry()
