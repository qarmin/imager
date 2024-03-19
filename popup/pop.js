console.log("click")


document.addEventListener("click", (event) => {
    console.log("RRR")
    if (event.target.id !== "myButton") {
        return;
    }

    const chosenPage = `https://${event.target.textContent}`;
    console.log(chosenPage)
});

console.log(document)
console.log(document.onclick)


//document.onClicked.addListener(async function (event) => {
//    console.log("AZZ")
//    if (event.target.id !== "myButton") {
//        return;
//    }
//
//    const chosenPage = `https://${event.target.textContent}`;
//    console.log(chosenPage)
//});