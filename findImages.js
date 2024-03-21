
var imageUrls = [];
var onlyImageUrls = [];
try {
// showMode - "biggestMode", "galleryMode"
// followAElements - true, false
// ignoreNonImageLinks - true, false
// rowsNumber - 1-infinity

var links = document.querySelectorAll('a');
var images = document.querySelectorAll('img');
var notAddedImageUrls = [];

// Looks that some pages uses images as links, without proper extension
var imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".tiff", ".ico"];
var dissalowedExtensions = [".mp4"]


function addImage(url, width, height) {
    if (url == "" || notAddedImageUrls.includes(url) || onlyImageUrls.includes(url) || dissalowedExtensions.some(ext => url.endsWith(ext))) {
        return false;
    }
    if (ignoreNonImageLinks && !imageExtensions.some(ext => url.includes(ext))) {
        return false;
    }

    imageUrls.push({"src": url, "width": width, "height": height});
    onlyImageUrls.push(url);
    return true;
}

if (followAElements) {
    for (var link of links) {
      var image = link.querySelector('img');
      if (image) {
        var added = false;
        added = addImage(link.href, image.width, image.height);
        if (!added) {
            addImage(image.src, image.width, image.height);
        } else {
            notAddedImageUrls.push(image.src);
        }
      }
    }
}

// Iterate over all images
for (const im of images) {
    addImage(im.src, im.width, im.height);
}

document.body.innerHTML = '';
document.body.style.backgroundColor = '#252525';
document.body.style.height = '100vh';
document.body.style.overflow = 'auto';

var all = []
var scripts = document.getElementsByTagName('script');
for (const script of scripts) {
    all.push(script);
}
var metas = document.getElementsByTagName('meta');
for (const meta of metas) {
    all.push(meta);
}
var links = document.getElementsByTagName('link');
for (const link of links) {
    all.push(link);
}

 for (var i = all.length; i >= 0; i--) {
   if (all[i] && all[i].parentNode) {
     all[i].parentNode.removeChild(all[i]);
   }
 }


var grid = null

if (showMode === "biggestMode" && imageUrls.length > 0) {
  imageUrls.sort((a, b) => {
    return b.width * b.height - a.width * a.height;
  });
    imageUrls = [imageUrls[0]];
} else {
    grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(' + rowsNumber + ', 1fr)';
    grid.style.gridGap = '10px';
}

for (var all_info of imageUrls) {
  var image_src = all_info.src;
    var width = all_info.width;
    var height = all_info.height;

    var aItem = document.createElement('a');
    var img = document.createElement('img');
    aItem.href = image_src;

    img.src = image_src;
    img.style.objectFit = 'contain';
    img.style.width = '100%';
    img.style.margin = '2px';
    aItem.appendChild(img);


  if (grid) {
    grid.appendChild(aItem);
  } else {
    window.location.href = image_src;
  }
}

if (grid) {
    document.body.appendChild(grid);
    window.scrollTo(0, 0);
}


} catch (e) {
  console.error(e);
}
imageUrls;