
let mycity= document.getElementById("mycity")
let myimage= document.getElementById("myimage")
let mytemp= document.getElementById("mytemp")

let myhumidity= document.getElementById("myhumidity")

let myresult= document.getElementById("myresult")

//when using openwheatermap we just need a key
let openkey= "dc439c07940578bea7bddf0375c7074c"

function minuti(min){
    return (min<10) ?  "0"+ min : min
}

//lets try weatherbit
let bit= "https://api.weatherbit.io/v2.0/current?lat=35.7796&lon=-78.6382&key=API_KEY&include=minutely"

let bitkey= "6669a6fd01c14380aac859c88b82b495"

//we deconstruct the position object in the argument
//we include the error function at the end if not geolocation
navigator.geolocation.getCurrentPosition(async ( {coords: {latitude, longitude}} ) => {

    let weatherbit= 
    "https://api.weatherbit.io/v2.0/current?lat=" + latitude +"&lon=" + longitude +"&key=" + bitkey 

    //let indirizzo= 
    //"https://api.openweathermap.org/data/2.5/weather?lat=" +lat +"&lon=" +lon + "&appid=" + openkey

    let response= await fetch(weatherbit)
    let jason= await response.json()

    mycity.innerText= jason.data[0].city_name
    mytemp.innerText= "Wind speed " + jason.data[0].wind_spd.toFixed(2) + " m/s"
                       + " Temp:" + jason.data[0].temp + " C°" 
    myhumidity.innerText= 
    "At time " + new Date().getHours() + ":" + minuti( new Date().getMinutes()) + " humidity is at " + jason.data[0].rh + "%"

    myimage.src= "https://www.weatherbit.io/static/img/icons/" + jason.data[0].weather.icon +".png"
    // https://www.weatherbit.io/static/img/icons/r01d.png
    // myimage.src= "http://openweathermap.org/img/wn/"+ jason.data[0].weather.icon +"@2x.png"

    placing(longitude, latitude )

} ,showError 
);


function showError(){

    alert("This device has not allowed Geolocation")
}

//Here we start with MAPBOX 
mapboxgl.accessToken = 'pk.eyJ1IjoibWlzdGVybGludXgiLCJhIjoiY2tnams0OGtzMDhqejJ4bGxmdWhia255YSJ9.htJI3nLHJoB62eOycK9KMA';

let counter= 0;
let places= []
let puntage= 0
let route;

let vincitore= []

let mappa= document.getElementById("map")

//we use this function for all the Map markers place positions and routes
async function placing(x, y){

    let centro= []
    let zoom= 14
    let lineDistance= 0;

    let steps = 150;

//we need 2 coordinates for the route, first we push 2 times counter
    if(counter> 0){
        places.push( x, y)
    }

//then we do the route
    if(counter==2){

// .center requires 3 positions, we use midpoint
        var midpoint = turf.midpoint( [places[0], places[1]] , [places[2], places[3]]  );
        centro= [midpoint.geometry.coordinates[0], midpoint.geometry.coordinates[1] ]


//routes coordinates are for the pushed in places
        route = {
            'type': 'FeatureCollection',
            'features': [
                {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': [ [places[0], places[1]], [places[2], places[3]] ]
                    }
                }
            ]
        };


        if( mappa.getBoundingClientRect().width< 500 ){
            lineDistance = turf.length( route.features[0] );
            let logarit= Math.pow(2, 11)/ ((lineDistance)/10) 

            zoom= Math.log( logarit)/ Math.log(2)   
            steps= 100
        }else{
            lineDistance = turf.length( route.features[0] );
            let logarit= Math.pow(2, 11)/ ((lineDistance)/18) 

            zoom= Math.log( logarit)/ Math.log(2)          
        }

    }else{
        centro= [x,y]
    }
    


//map container takes any ID,  and style for satellite
const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v10',
        center: centro,
        zoom: zoom,
        pitch: 30
        //projection: 'globe'
    });


//about the markers    
    if(counter == 0 || counter == 1){
        let marker1 = new mapboxgl.Marker()
        .setLngLat([ x, y])
        .addTo(map);
    }else{

//this else has the entire ROUTE animation
        let marker1 = new mapboxgl.Marker()
        .setLngLat([ places[0], places[1]])
        .addTo(map);

        let marker2 = new mapboxgl.Marker()
        .setLngLat([ places[2], places[3]])
        .addTo(map);


//we create a starting point
        const point = {
            'type': 'FeatureCollection',
            'features': [
                {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [places[2], places[3]]
                    }
                }
            ]
        };

//getting the distance and score
        let lontano= document.getElementById("lontano")
        let puntamento= document.getElementById("puntamento")
        let finale= document.getElementById("finale")

//for animation coordinates for the icon
        let contatore= 0
        let arc= []

//we get each frames from the distance to animate later
        for (let i = 0; i < lineDistance; i += lineDistance / steps) {
                const segment = turf.along(route.features[0], i);
                arc.push(segment.geometry.coordinates);
        }

//we then remember to push the frames coordinate to the arc
        route.features[0].geometry.coordinates = arc;


  map.on('load', () => {

    map.loadImage(

        'https://img.icons8.com/color/344/airport.png',

        (error, image) => {
        if (error) throw error;
        
        // Add the image to the map style.
        map.addImage('cat', image);
        
        // data source, including starting point of the icon
        map.addSource('point', {
        'type': 'geojson',
        'data': {
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [places[0], places[1]]
                }
            }]
            }
        })
        }
      )

    map.addSource('route', {
        'type': 'geojson',
        'data': route
    });

    map.addSource('point', {
        'type': 'geojson',
        'data': point
      });

    map.addLayer({
        'id': 'route',
        'source': 'route',
        'type': 'line',
        'paint': {
            'line-width': 3,
            'line-color': '#dcecf2'
        }
    });

    map.addLayer({
        'id': 'point',
        'source': 'point',
        'type': 'symbol',
        'layout': {
    
//'icon-rotate': we can use a number for the degrees here   
//the bearing rotate works with facing up icon   
            'icon-image': 'cat',
            'icon-size': 0.1,
            'icon-rotate': ['get', 'bearing'],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
        }
      });

//this is to help set the score on distance
      if(distanza > lineDistance){
        puntage= ( [lineDistance - (distanza - lineDistance)] /lineDistance)
      }else{
        puntage= (distanza/ lineDistance) 
      }

//to get the 2 decimals returned as a string
      vincitore.push( ( puntage* 100 ).toFixed(2) )
      
        function animate() {
//for each of the 200 arc coordinates
                  const start =
                      route.features[0].geometry.coordinates[
                          contatore >= steps ? contatore - 1 : contatore
                      ];
            
                  const end =
                      route.features[0].geometry.coordinates[
                          contatore >= steps ? contatore : contatore + 1
                      ];
                
                  point.features[0].geometry.coordinates =
                      route.features[0].geometry.coordinates[contatore];
                    
                  point.features[0].properties.bearing = turf.bearing(
                      turf.point(start),
                      turf.point(end)
                  );
                

                lontano.innerText= ((lineDistance/steps) * contatore).toFixed(2) 
                puntamento.innerText= ( (( puntage/steps) * contatore)* 100 ).toFixed(2)
                
//updating the point data (coordinates)
                  map.getSource('point').setData(point);
//as long as contatore we ask the frame function
                  if (contatore < steps) {
                      requestAnimationFrame(animate);
                  }
            
                  contatore = contatore + 1;
            }
        
        
        animate(contatore)
        
        if( vincitore.length<= 1 ){
            finale.innerText= "Waiting player 2"
        }else{
            if( vincitore[0]> vincitore[1]){
                finale.innerText= "Player 1 wins with " + vincitore[0] + "%"
            }else{
                finale.innerText= "Player 2 wins with " + vincitore[1] + "%"
            }

            vincitore= []
        }

  })

    btnprimo.disabled= true
    btndist.disabled= false

    places= []

    distance.value= ""
    primo.value= ""
    secondo.value= ""

    counter= 0
    }

}


let distanza= 0

let primo= document.getElementById("primo")
let secondo= document.getElementById("secondo")
let btnprimo= document.getElementById("btnprimo")

let giocata= []

btnprimo.addEventListener("click", async (e)=>{
    e.preventDefault()

    giocata.push(primo.value )
    giocata.push(secondo.value )

//to simply filter strings we can  a.filter(isNaN);
//will filter only those that are strings
//will pass only those that ARE NOT a number and exist, so no empty
    const passed = giocata.filter( (x) =>
        isNaN(x) && x
    )

    if( passed.length < 2){
        distance.value= ""
        primo.value= ""
        secondo.value= ""

        btndist.disabled= false
        btnprimo.disabled= true

        alert("insert 2 cities names to start")

        giocata= []

    }else{


    let indirizzo= "https://api.weatherbit.io/v2.0/current?&city="+ primo.value + "&key=" + bitkey 

    let request= await fetch(indirizzo)
    let jason= await request.json()

    let indirizzo2= "https://api.weatherbit.io/v2.0/current?&city="+ secondo.value+ "&key="+ bitkey 

    let request2= await fetch(indirizzo2)
    let jason2= await request2.json()

    counter+= 1
    placing( jason.data[0].lon,  jason.data[0].lat )

    counter+= 1
    placing( jason2.data[0].lon,  jason2.data[0].lat )

    }

})


let distance= document.getElementById("distance")
let btndist= document.getElementById("btndist")

btnprimo.disabled= true
//document.getElementById("cont").disabled = true;

btndist.addEventListener("click", (e)=>{

    e.preventDefault()

    distanza= distance.value

    console.log( !isNaN(distance.value) )

    if( !isNaN(distance.value) ){
        btndist.disabled= true
        btnprimo.disabled= false
    }else{
        distance.value= ""
        alert("insert a number value of KM")
    }
    
})

