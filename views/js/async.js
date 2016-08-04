// PIZZA RESIZER _______________________________________________________________
/*
  Pizza Resizer is a singleton obj that wraps all functions neede for changing
  pizza size, since constantly defining functions and variables each time the
  event listener is triggered is not performant. We create a single instance of
  this object while page is loading.
  Defining most of these helper function on the global scope will pollute it, so
  they get wrapped inside this singleton.
*/
var PizzaResizer = (function PizzaResizerInstanciator() {
  var instance;

  function PizzaResizer() {
    // Private props and methods
    var randomPizzas = document.getElementById('randomPizzas');
    
    // Changes the slider value to a percent width
    function sizeSwitcher (size) {
      var classBase = 'randomPizzaContainer',
          classLarge = classBase + '--large',
          classSmall = classBase + '--small';

      switch(size) {
        case "1":
          return function resizeSmall(DOMNode) {
            var classList = DOMNode.classList;
            classList.remove(classLarge);
            classList.add(classSmall);
          };
        case "2":
          return function resizeMedium(DOMNode) {
            var classList = DOMNode.classList;
            classList.remove(classLarge);
            classList.remove(classSmall);
          };
        case "3":
          return function resizeLarge(DOMNode) {
            var classList = DOMNode.classList;
            classList.remove(classSmall);
            classList.add(classLarge);
          };
        default:
          console.log("bug in sizeSwitcher");
      }
    }

    // Changes the value for the size of the pizza above the slider
    function changeSliderLabel(size) {
      var slider = document.getElementById("pizzaSize");
      switch(size) {
        case "1":
          slider.innerHTML = "Small";
          return;
        case "2":
          slider.innerHTML = "Medium";
          return;
        case "3":
          slider.innerHTML = "Large";
          return;
        default:
          console.log("bug in changeSliderLabel");
      }
    }

    return {
      // Iterates through pizza elements on the page and changes their widths
      changePizzaSizes: function (size) {
        var randomContainers = document.getElementsByClassName('randomPizzaContainer'),
            changingFunction = sizeSwitcher(size);
        changeSliderLabel(size);

        for (var i = 0, max = randomContainers.length; i < max; i+=1) {
          changingFunction(randomContainers[i]);
        }
      }
    };
  }

  return {
    getInstance: function() {
      if(!instance) {
        instance = PizzaResizer();
      }
      return instance;
    }
  };
})();

var Mover = (function MoverInstanciator(){
  var instance;

  function Mover() {
    // Iterator for number of times the pizzas in the background have scrolled.
    // Used by updatePositions() to decide when to log the average time per frame
    var frame = 0;

    // This variable holds references for .mover elements.
    var movers = [];

    // Logs the average amount of time per 10 frames needed to move the sliding background pizzas on scroll.
    function logAverageFrame(times) {   // times is the array of User Timing measurements from updatePositions()
      var numberOfEntries = times.length;
      var sum = 0;
      for (var i = numberOfEntries - 1; i > numberOfEntries - 11; i--) {
        sum = sum + times[i].duration;
      }
      console.log("Average scripting time to generate last 10 frames: " + sum / 10 + "ms");
    }

    return {
      // The following code for sliding background pizzas was pulled from Ilya's demo found at:
      // https://www.igvita.com/slides/2012/devtools-tips-and-tricks/jank-demo.html

      // Moves the sliding background pizzas based on scroll position
      updatePositions: function () {
        var bodyScrollTop = document.body.scrollTop / 1250;
        frame++;
        window.performance.mark("mark_start_frame");

        for (var i = 0, max = movers.length; i < max; i+=1) {
          var phase = Math.sin(bodyScrollTop + (i % 5));
          movers[i].style.left = movers[i].basicLeft + 100 * phase + 'px';
        }

        // User Timing API to the rescue again. Seriously, it's worth learning.
        // Super easy to create custom metrics.
        window.performance.mark("mark_end_frame");
        window.performance.measure("measure_frame_duration", "mark_start_frame", "mark_end_frame");
        if (frame % 10 === 0) {
          var timesToUpdatePosition = window.performance.getEntriesByName("measure_frame_duration");
          logAverageFrame(timesToUpdatePosition);
        }
      },

      initialLoad: function() {
        var cols = 8,
            s = 256,
            numberOfRows = Math.round(window.screen.height / s),
            numberOfPizzas = numberOfRows * cols,
            elem;

        for (var i = 0; i < numberOfPizzas; i++) {
          elem = document.createElement('img');
          elem.className = 'mover';
          elem.src = "images/misc/pizza.png";
          elem.style.height = "100px";
          elem.style.width = "73.333px";
          elem.basicLeft = (i % cols) * s;
          elem.style.top = (Math.floor(i / cols) * s) + 'px';
          document.getElementById('movingPizzas1').appendChild(elem);
          movers.push(elem);
        }

        requestAnimationFrame(this.updatePositions);
      }
    };
  }


  return {
    getInstance: function() {
      if(!instance) {
        return Mover();
      }
      return instance;
    }
  };
})();

// CODE EXECUTED AFTER LOAD EVENT ______________________________________________
window.addEventListener('load', function windowLoad(){
  var pizzaMover = Mover.getInstance(),
      slider = document.getElementById('sizeSlider');

  // Listener resizePizzas has a closure on these variables
  var pizzaResizer = PizzaResizer.getInstance(),
      perfAPI = window.performance;

  // Add the listener for changing pizza sizes.
  // resizePizzas(size) is called when the slider in the "Our Pizzas" section of the website moves.
  slider.addEventListener('change', function resizePizzas(evt) {
    var size = evt.target.value;

    perfAPI.mark("mark_start_resize");   // User Timing API function

    pizzaResizer.changePizzaSizes(size);

    // User Timing API is awesome
    perfAPI.mark("mark_end_resize");
    perfAPI.measure("measure_pizza_resize", "mark_start_resize", "mark_end_resize");
    var timeToResize = perfAPI.getEntriesByName("measure_pizza_resize");
    console.log("Time to resize pizzas: " + timeToResize[timeToResize.length-1].duration + "ms");
  });

  // This calls the initial loading phase of pizzas in background
  pizzaMover.initialLoad();

  // runs updatePositions on scroll
  window.addEventListener('scroll', function onWindowScroll() {
    requestAnimationFrame(pizzaMover.updatePositions);
  });
});
// --> END CODE EXECUTED AFTER LOAD EVENT ______________________________________
