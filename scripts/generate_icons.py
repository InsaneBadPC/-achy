#!/usr/bin/env python3
"""
Generate all app icon assets for Android launcher and Web/PWA
"""
import os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import scipy.ndimage as ndi

SRC_IMG = r"C:\Users\insane\.gemini\antigravity\brain\5acf88f9-965a-4705-86bf-f23a90126dd0\wacky_chess_mayhem_icon_1793721902185.jpg"
REPO_DIR = r"c:\Users\insane\Documents\sachy\repo"
PUBLIC_DIR = os.path.join(REPO_DIR, "public")
ANDROID_RES = os.path.join(REPO_DIR, "android", "app", "src", "main", "res")

def main():
    print(f"Loading source icon: {SRC_IMG}")
    raw_img = Image.open(SRC_IMG).convert("RGBA")
    arr = np.array(raw_img)

    # 1. Clean squircle mask by removing external corner whites
    white_bg = (arr[:, :, 0] > 240) & (arr[:, :, 1] > 240) & (arr[:, :, 2] > 240)
    labeled, _ = ndi.label(white_bg)
    corner_labels = set([labeled[0, 0], labeled[0, 1023], labeled[1023, 0], labeled[1023, 1023]])
    corner_mask = np.isin(labeled, list(corner_labels))

    alpha = np.ones((1024, 1024), dtype=np.uint8) * 255
    alpha[corner_mask] = 0

    alpha_img = Image.fromarray(alpha, mode="L")
    alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=1.2))

    clean_squircle = raw_img.copy()
    clean_squircle.putalpha(alpha_img)

    # 2. Clean circular mask for round icons
    circle_mask = Image.new("L", (1024, 1024), 0)
    draw_c = ImageDraw.Draw(circle_mask)
    draw_c.ellipse((40, 40, 984, 984), fill=255)
    circle_mask = circle_mask.filter(ImageFilter.GaussianBlur(radius=1.5))

    clean_circle = raw_img.copy()
    clean_circle.putalpha(circle_mask)

    # 3. Helper to make adaptive foreground with safe zone
    def make_adaptive_foreground(canvas_size: int, safe_ratio: float = 0.74) -> Image.Image:
        icon_size = int(canvas_size * safe_ratio)
        resized_icon = clean_squircle.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        
        canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
        offset = (canvas_size - icon_size) // 2
        canvas.paste(resized_icon, (offset, offset), resized_icon)
        return canvas

    # --- Generate Web & PWA assets ---
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    print("Generating Web/PWA icons...")

    # apple-touch-icon.png (180x180)
    clean_squircle.resize((180, 180), Image.Resampling.LANCZOS).save(
        os.path.join(PUBLIC_DIR, "apple-touch-icon.png"), "PNG"
    )

    # pwa-192x192.png
    clean_squircle.resize((192, 192), Image.Resampling.LANCZOS).save(
        os.path.join(PUBLIC_DIR, "pwa-192x192.png"), "PNG"
    )

    # pwa-512x512.png
    clean_squircle.resize((512, 512), Image.Resampling.LANCZOS).save(
        os.path.join(PUBLIC_DIR, "pwa-512x512.png"), "PNG"
    )

    # icon.png
    clean_squircle.resize((512, 512), Image.Resampling.LANCZOS).save(
        os.path.join(PUBLIC_DIR, "icon.png"), "PNG"
    )

    # pwa-maskable-512x512.png (with safe area)
    maskable_512 = make_adaptive_foreground(512, safe_ratio=0.80)
    maskable_512.save(os.path.join(PUBLIC_DIR, "pwa-maskable-512x512.png"), "PNG")

    # favicon.png (64x64)
    clean_squircle.resize((64, 64), Image.Resampling.LANCZOS).save(
        os.path.join(PUBLIC_DIR, "favicon.png"), "PNG"
    )

    # favicon.ico
    clean_squircle.resize((48, 48), Image.Resampling.LANCZOS).save(
        os.path.join(PUBLIC_DIR, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)]
    )

    # --- Generate Android Mipmap assets ---
    android_densities = {
        "mipmap-mdpi": {"launcher": 48, "foreground": 108},
        "mipmap-hdpi": {"launcher": 72, "foreground": 162},
        "mipmap-xhdpi": {"launcher": 96, "foreground": 216},
        "mipmap-xxhdpi": {"launcher": 144, "foreground": 324},
        "mipmap-xxxhdpi": {"launcher": 192, "foreground": 432},
    }

    print("Generating Android mipmap launcher icons...")
    for folder, sizes in android_densities.items():
        target_dir = os.path.join(ANDROID_RES, folder)
        os.makedirs(target_dir, exist_ok=True)

        l_size = sizes["launcher"]
        fg_size = sizes["foreground"]

        # ic_launcher.png (standard squircle)
        clean_squircle.resize((l_size, l_size), Image.Resampling.LANCZOS).save(
            os.path.join(target_dir, "ic_launcher.png"), "PNG"
        )

        # ic_launcher_round.png (circular)
        clean_circle.resize((l_size, l_size), Image.Resampling.LANCZOS).save(
            os.path.join(target_dir, "ic_launcher_round.png"), "PNG"
        )

        # ic_launcher_foreground.png (adaptive foreground)
        fg_img = make_adaptive_foreground(fg_size, safe_ratio=0.74)
        fg_img.save(os.path.join(target_dir, "ic_launcher_foreground.png"), "PNG")

        print(f"  -> Generated {folder}: launcher={l_size}x{l_size}, foreground={fg_size}x{fg_size}")

    print("All icons successfully generated!")

if __name__ == "__main__":
    main()

