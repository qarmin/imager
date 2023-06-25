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
    return;
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


document.addEventListener('DOMContentLoaded', function() {
  var myButton = document.getElementById('myButton');
    console.log('AAAA', myButton);
  myButton.addEventListener('click', function() {
    console.log('Wykonano opcję');
  });
});

window.addEventListener("load", (event) => {
    var myButton = document.getElementById('myButton');
    console.log("FF", myButton)
})

var myButton = document.getElementById('myButton');
    console.log(myButton)
    document.addEventListener('DOMContentLoaded', function() {
    console.log('Wykonano opcj222222222222');
    var myButton = document.getElementById('myButton');
    myButton.addEventListener('click', function() {
    // Tutaj umieść kod wykonujący daną opcję po kliknięciu przycisku
        console.log('Wykonano opcję');
    });
});





function logNewEvent(eventType) {
  console.log('Nowy event: ' + eventType);
}

// Definicja funkcji, która monitoruje zmiany w obiekcie document
function observeDocument() {
    console.log("RRRRRRRRRRRRRRRRRR")
  Object.defineProperty(document, 'addEventListener', {
    value: function (eventType, listener, options) {
      logNewEvent(eventType); // Wywołanie funkcji logującej nowy event
    console.log("GGGGGGGGGGGG")
      return EventTarget.prototype.addEventListener.call(this, eventType, listener, options);
    },
    writable: true,
    enumerable: false,
    configurable: true
  });
}

// Uruchomienie monitorowania zmian w obiekcie document
observeDocument();
