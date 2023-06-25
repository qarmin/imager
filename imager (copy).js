function getAllImageURLs() {
  var images = document.getElementsByTagName('img');
  var imageURLs = [];
  console.log("Images len", images)

  for (var i = 0; i < images.length; i++) {
    var img = images[i];
    var url = img.src;
    if (img.width < 50 || img.height < 50) {
        console.log("Ignoring", url, img.width, img.height)
        continue;
    }
    console.log(url, img.width, img.height)
    imageURLs.push({
        url: img.src,
        width: img.width,
        height: img.height
    });
  }
  
  return imageURLs
}

function addImages(imageURLs) {
    let sizeOfImage = 300;
    for (const imageURL of imageURLs) {
        var a = document.createElement('a');
        var image = document.createElement('img');
        image.src = imageURL.url;
        
        let sizeRatio = sizeOfImage / Math.max(imageURL.width, imageURL.height)
        image.width = imageURL.width * sizeRatio
        image.height = imageURL.height * sizeRatio
        
        a.href = image.src
        a.appendChild(image);
        document.getElementById('imageContainer').appendChild(a);
    }
}

console.log("Starting");

window.addEventListener("load", (event) => {
    try {
        console.log("Page is fully loaded");
        
        console.log("Getting Results")
        let imageURLs = getAllImageURLs();
        
        console.log("Cleaning URL")
        document.body.innerHTML = '';
        
        console.log("Creating image container")
        var imageContainer = document.createElement('div');
        imageContainer.id = 'imageContainer';
        document.body.appendChild(imageContainer);
        
        console.log("Added images")
        addImages(imageURLs)
        
        console.log("After all");
    } catch(e) {
        console.error(e)
    }
});
