
var totalLines =0;
function GetPoemArray(poemID)
{
    var poem = document.getElementById(poemID).innerHTML;
    return poem.split("<br>");
}


function RandomNumber(max)
{
    return Math.floor(Math.random()*Math.floor(max));
}

function GetLine(poemArray)
{
    var line = poemArray[RandomNumber(poemArray.length)]+"<br>";
    console.log(line);
    return line;
}


function WriteToMain(poemArray)
{
    var lineNode = document.createElement('span');
    lineNode.innerHTML = GetLine(poem1Array);
    document.getElementById("main").appendChild(lineNode);
    lineNode.scrollIntoView();
    lineNode.className = "strokeText";
   // RefreshGradient();
    //ChangeColorText();
}

function ChangeColorText()
{
    var el = document.getElementsByTagName("body");
    var height  = el.scrollHeight;
    //console.log(height); 

}

function RefreshGradient()
{
    var body = document.getElementsByTagName("html");
    var main = document.getElementById("container");
    var percHeight = main.height/body.scrollHeight;
   console.log(body.ScrollHeight);

}

function AddListener(elementId, poemArray)
{
    document.getElementById(elementId).onclick = function(){WriteToMain(poemArray)};
}
var poem1Array = GetPoemArray("poem1");//Haunted Place
var poem2Array = GetPoemArray("poem2");//Raven
var poem3Array = GetPoemArray("poem3");// Annabel Lee
var poem4Array = GetPoemArray("poem4");// A Dream
var poem5Array = GetPoemArray("poem5");// A Dream Within a Dream

AddListener("p1",poem1Array);
AddListener("p2",poem2Array);
AddListener("p3",poem3Array);
AddListener("p4",poem4Array);
AddListener("p5",poem5Array);



//console.log("Poem Lenght: " + poem1Array.length);
//console.log("Poem Lenght: " + poem2Array.length);
//console.log("Poem Lenght: " + poem3Array.length);
//console.log("Poem Lenght: " + poem4Array.length);
//console.log("Poem Lenght: " + poem5Array.length);





