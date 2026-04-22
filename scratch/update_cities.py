import re

html_path = "dotnet/APEX.WebAPI/wwwroot/index.html"
with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

images = {
    "Paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&q=80",
    "Lyon": "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1000&q=80",
    "Marseille": "https://images.unsplash.com/photo-1563964461017-cbe0be1ef5a3?w=1000&q=80",
    "Toulouse": "https://images.unsplash.com/photo-1610332822830-589574efbcbf?w=1000&q=80",
    "Nice": "https://images.unsplash.com/photo-1557948286-9a2cdd74cc5b?w=1000&q=80",
    "Lille": "https://images.unsplash.com/photo-1598284534125-630ebbf21147?w=1000&q=80",
    "Nantes": "https://images.unsplash.com/photo-1596700810459-bc1dfecbae10?w=1000&q=80",
    "Strasbourg": "https://images.unsplash.com/photo-1599839619722-39751411ea63?w=1000&q=80",
    "Bordeaux": "https://images.unsplash.com/photo-1517036224446-2475ab5ec7d3?w=1000&q=80",
    "Rennes": "https://images.unsplash.com/photo-1562208164-964fa4c4b69d?w=1000&q=80",
    "Grenoble": "https://images.unsplash.com/photo-1606830589255-a50d2f00a5a5?w=1000&q=80",
    "Reims": "https://images.unsplash.com/photo-1662489431713-3ff1656885df?w=1000&q=80"
}

for city, url in images.items():
    pattern = rf"(<div class=\"city-card-gallery\" onclick=\"searchChip\('','{city}'\); return false;\">\s*<div class=\"city-gallery-img\"[\s\n]*style=\"background-image:url\(')[^']*('\)\">)"
    content = re.sub(pattern, rf"\g<1>{url}\g<2>", content)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated city images.")
