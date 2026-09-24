import os
import re
import zipfile

def build_zip():
    dist_dir = 'dist'
    public_zip = 'public/webintoapp_pacote.zip'
    dist_zip = 'dist/webintoapp_pacote.zip'

    if not os.path.exists(dist_dir):
        print("dist directory does not exist yet.")
        return

    # Read and clean index.html for Android WebView local execution
    index_html_path = os.path.join(dist_dir, 'index.html')
    with open(index_html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # 1. Remove crossorigin attribute from script and link tags for file:/// compatibility
    cleaned_html = html_content.replace(' crossorigin', '').replace('crossorigin', '')
    
    # 2. Remove registerSW.js tag since Service Workers do not run under file:/// protocol in WebView
    cleaned_html = re.sub(r'<script[^>]*register-sw[^>]*>.*?</script>', '', cleaned_html)
    cleaned_html = re.sub(r'<link[^>]*manifest\.webmanifest[^>]*>', '', cleaned_html)

    # Allowed extensions that WebIntoApp safely accepts
    allowed_extensions = {'.html', '.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.json', '.woff', '.woff2', '.ttf'}

    # Build zip in memory/file using standard ZIP_DEFLATED with Unix attributes
    temp_zip = 'public/webintoapp_pacote.zip'
    
    with zipfile.ZipFile(temp_zip, 'w', zipfile.ZIP_DEFLATED) as z:
        # Write modified index.html first at the root
        zinfo_index = zipfile.ZipInfo('index.html')
        zinfo_index.external_attr = 0o644 << 16
        zinfo_index.compress_type = zipfile.ZIP_DEFLATED
        z.writestr(zinfo_index, cleaned_html.encode('utf-8'))

        # Walk dist directory
        for root, dirs, files in os.walk(dist_dir):
            for file in files:
                if file in ('webintoapp_pacote.zip', 'index.html', 'registerSW.js', 'sw.js'):
                    continue
                if file.startswith('workbox-'):
                    continue
                if file.endswith('.webmanifest'):
                    continue

                ext = os.path.splitext(file)[1].lower()
                if ext not in allowed_extensions:
                    continue

                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, dist_dir)

                # Standardize path separators to forward slash
                rel_path = rel_path.replace('\\', '/')

                with open(full_path, 'rb') as f:
                    file_data = f.read()

                # Add file with explicit standard Unix permissions
                zinfo = zipfile.ZipInfo(rel_path)
                zinfo.external_attr = 0o644 << 16  # -rw-r--r--
                zinfo.compress_type = zipfile.ZIP_DEFLATED
                z.writestr(zinfo, file_data)

    # Copy to dist as well so it's immediately servable in both dev and prod
    with open(temp_zip, 'rb') as f:
        data = f.read()
    with open(dist_zip, 'wb') as f:
        f.write(data)

    print(f"Pacote WebIntoApp gerado com sucesso! Tamanho: {len(data)} bytes ({len(data)/1024:.1f} KB)")

if __name__ == '__main__':
    build_zip()
