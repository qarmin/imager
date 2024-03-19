{
try {


let links = document.querySelectorAll('a');
let images = document.querySelectorAll('img');
let imageUrls = [];
let notAddedImageUrls = [];

// Looks that some pages uses images as links, without proper extension
let imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".tiff", ".ico"];
let dissalowedExtensions = [".mp4"]


function addImage(url, width, height) {
  if (url != "" && !imageUrls.includes(url) && !notAddedImageUrls.includes(url) && !dissalowedExtensions.some(ext => url.endsWith(ext))) {
//    if (imageExtensions.some(ext => url.endsWith(ext))) {
        imageUrls.push({"src": url, "width": width, "height": height});
        return true;
//    }
  }
    return false;
}


for (let link of links) {
  let image = link.querySelector('img');
  if (image) {
    let added = false;
    added = addImage(link.href, image.width, image.height);
    if (!added) {
        addImage(image.src, image.width, image.height);
    } else {
        notAddedImageUrls.push(image.src);
    }
  }
}

for (const im of images) {
    addImage(im.src, im.width, im.height);
}

let scripts = document.getElementsByTagName('script');
 for (let i = scripts.length; i >= 0; i--) {
   if (scripts[i]) {
     scripts[i].parentNode.removeChild(scripts[i]);
   }
 }

document.body.innerHTML = '';
document.body.style.backgroundColor = '#252525';
document.body.style.height = '100vh';
document.body.style.overflow = 'auto';

let grid = null

if (showMode === "biggestMode" && imageUrls.length > 0) {
  imageUrls.sort((a, b) => {
    return b.width * b.height - a.width * a.height;
  });
imageUrls = [imageUrls[0]];
} else {
    document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(6, 1fr)';
    grid.style.gridGap = '10px';
}

for (let all_info of imageUrls) {
  let image_src = all_info.src;
    let width = all_info.width;
    let height = all_info.height;

  let img = document.createElement('img');
  img.src = image_src;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'contain';
  img.style.margin = '2px';


  if (grid) {
   img.style.cursor = 'pointer';

  img.addEventListener('click', function() {
    window.location.href = this.src;
  });

  img.addEventListener('auxclick', function(event) {
    if (event.button === 1) {
      window.open(this.src, '_blank').blur();
      window.focus();
    }
  });
    grid.appendChild(img);
  } else {
    document.body.appendChild(img);
  }
}

if (grid) {
    document.body.appendChild(grid);
}
window.scrollTo(0, 0);

} catch (e) {
  console.error(e);
}
}
undefined;