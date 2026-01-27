from PIL import Image, ImageDraw
import math

def generate_icon(size=1024):
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colors
    c_indigo_600 = (79, 70, 229, 255)  # #4f46e5
    c_indigo_500 = (99, 102, 241, 255) # #6366f1
    c_slate_300 = (203, 213, 225, 255) # #cbd5e1
    
    # Scale calculation
    # Original SVG bounding box was approx x[10-70] over w=80 viewbox
    # We want to fill about 80% of the 1024px canvas
    scale = size * 0.8 / 60
    center_x = size / 2
    center_y = size / 2
    
    # Helper to transform coordinates
    # SVG logical coords: Center around (40, 25)
    def t(x, y):
        x_shifted = (x - 40) * scale + center_x
        y_shifted = (y - 25) * scale + center_y
        return x_shifted, y_shifted

    # Line width
    stroke = int(6 * scale / 10) # 6 in SVG unit usually
    rungs_width = int(stroke * 0.6)
    dot_r = int(4 * scale / 10) # 4 in SVG unit
    
    # Coordinates from SVG
    # Top Strand Points: (10,0) -> Q(25,25) -> (40,0) -> T(70,0) -> implied Q(55,-25)
    # Bottom Strand Points: (10,50) -> Q(25,25) -> (40,50) -> T(70,50)
    
    # Since drawing smooth beziers manually is hard, we'll just draw the points and connecting lines
    # actually, simple sine waves look like DNA
    
    points_top = []
    points_bot = []
    steps = 100
    
    # Draw Sine Waves to simulate DNA strands
    # x goes from left to right
    start_x = -30
    end_x = 30
    
    for i in range(steps + 1):
        progress = i / steps
        lx = start_x + (end_x - start_x) * progress
        # simple phase shift for double helix
        # Top starts high, goes low
        ty = 20 * math.cos(progress * math.pi * 2) 
        # Bot starts low, goes high
        by = 20 * math.sin(progress * math.pi * 2 + math.pi/2) # actually standard double helix is anti-parallel
        
        # Adjust to match the SVG look roughly:
        # SVG logic: 
        # Strand 1: (10,0) to (70,0) with dip at 25,25
        # It's actually crossing at 25?
        pass

    # Direct drawing of the SVG paths (simplified as connected lines for clarity if bezier fails, but we can compute bezier)
    # Quadratic Bezier formula: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
    
    def get_quad_bezier_points(p0, p1, p2, num_points=20):
        pts = []
        for i in range(num_points + 1):
            t_val = i / num_points
            x = (1-t_val)**2 * p0[0] + 2*(1-t_val)*t_val * p1[0] + t_val**2 * p2[0]
            y = (1-t_val)**2 * p0[1] + 2*(1-t_val)*t_val * p1[1] + t_val**2 * p2[1]
            pts.append((x, y))
        return pts

    # SVG Path 1 (Indigo 600): M10,0 Q25,25 40,0 T70,0
    # Segment 1: M10,0 to 40,0 via 25,25
    path1_pts = get_quad_bezier_points((10, 0), (25, 25), (40, 0), 40)
    # Segment 2: 40,0 to 70,0. Control point is reflection of previous control (25,25) relative to current (40,0) => (55, -25)
    path1_pts += get_quad_bezier_points((40, 0), (55, -25), (70, 0), 40)
    
    # SVG Path 2 (Indigo 500): M10,50 Q25,25 40,50 T70,50
    # Segment 1: M10,50 to 40,50 via 25,25
    path2_pts = get_quad_bezier_points((10, 50), (25, 25), (40, 50), 40)
    # Segment 2: 40,50 to 70,50. Control refl of 25,25 vs 40,50 => 55, 75
    path2_pts += get_quad_bezier_points((40, 50), (55, 75), (70, 50), 40)
    
    # Transform and Draw Lines
    def draw_thick_line(points, color, width):
        transformed = [t(p[0], p[1]) for p in points]
        draw.line(transformed, fill=color, width=width, joint='curve')

    # Draw Rungs First (Behind strands usually, or between)
    # (25, 12) to (25, 38)
    line1 = [(25, 12), (25, 38)]
    line2 = [(55, 12), (55, 38)]
    
    draw_thick_line(line1, c_slate_300, rungs_width)
    draw_thick_line(line2, c_slate_300, rungs_width)

    # Draw Strands
    draw_thick_line(path1_pts, c_indigo_600, stroke)
    draw_thick_line(path2_pts, c_indigo_500, stroke)
    
    # Draw Dots (Atom circles)
    dots_indigo = [(10,0), (40,0), (70,0)]
    dots_violet = [(10,50), (40,50), (70,50)]
    
    def draw_dot(pos, color, r):
        cx, cy = t(pos[0], pos[1])
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=color)

    for p in dots_indigo:
        draw_dot(p, c_indigo_600, dot_r)
        
    for p in dots_violet:
        draw_dot(p, c_indigo_500, dot_r)

    # Save Master PNG
    import os
    os.makedirs('desktop/tauri/icons', exist_ok=True)
    master_path = 'desktop/tauri/icons/icon.png'
    img.save(master_path, 'PNG')
    print(f"Generated 1024x1024 icon at {master_path}")
    
    # Generate .ico with multiple sizes (Required: 16, 32, 48, 64, 128, 256)
    icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    img.save('desktop/tauri/icons/icon.ico', sizes=icon_sizes)
    print("Generated multi-resolution icon.ico")

    # Generate specific PNGs for Linux/Web use
    img.resize((32, 32), Image.Resampling.LANCZOS).save('desktop/tauri/icons/32x32.png')
    img.resize((128, 128), Image.Resampling.LANCZOS).save('desktop/tauri/icons/128x128.png')
    print("Generated 32x32.png and 128x128.png")

if __name__ == "__main__":
    generate_icon()
