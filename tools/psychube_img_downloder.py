import requests
from bs4 import BeautifulSoup
from pathlib import Path
from urllib.parse import urljoin


def fetch_image_urls(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    img_tags = soup.find_all('img')
    return [
        urljoin(url, img['src'])
        for img in img_tags if 'src' in img.attrs
    ]


def fetch_names(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    names_list = soup.find_all(class_="name")
    return [name.get_text(strip=True) for name in names_list]


def find_names(names, file_path="pcychube_names/names.txt"):
    Path(file_path).parent.mkdir(exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        for name in names:
            f.write(name + '\n')
    print(f'✅ {len(names)} names written to {file_path}')




def download_images(urls, download_dir='images/psychubes'):
    Path(download_dir).mkdir(exist_ok=True)
    for i, url in enumerate(urls):
        try:
            img_data = requests.get(url).content
            ext = url.split('.')[-1].split('?')[0]
            filename = f'image_{i:03d}.{ext}'
            with open(Path(download_dir) / filename, 'wb') as f:
                f.write(img_data)
            print(f'✅ {filename} downloaded')
        except Exception as e:
            print(f'❌ Error downloading {url}: {e}')



url = "https://www.prydwen.gg/re1999/psychubes/"
image_urls = fetch_image_urls(url)
download_images(image_urls)

names = fetch_names(url)
find_names(names)