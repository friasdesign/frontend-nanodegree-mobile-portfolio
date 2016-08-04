/*
  `async.js` covers all logic that is not crucial for rendering content this is:
    - Resizing pizzas using the slider.
    - Loading pizzas in background.
    - Move pizzas in background at scrolling.
*/

// PIZZA RESIZER _______________________________________________________________
/*
  Pizza Resizer is a singleton obj that wraps all functions needed for changing
  pizza size, since constantly defining functions and variables each time the
  event listener is triggered is not performant. We create a single instance of
  this object while page is loading.
  Defining most of these helper function on the global scope will pollute it, so
  they get wrapped inside this singleton.
*/

/**
 * A `PizzaResizerInstanciator` is used to create a unique instance of
 * `PizzaResizer`, if called more than once, the same instance is returned.
 * 
 * @class PizzaResizerInstanciator
 * @static
 */
var PizzaResizer = (function PizzaResizerInstanciator() {
  /**
   * Instance of `PizzaResizer` to be returned
   *
   * @property instance
   * @type PizzaResizer
   */
  var instance;

  /**
   * `PizzaResizer` object is a singleton object used to deal with all logic
   * related to resizing pizzas when slider changes. Wrapping all these
   * functions inside a singleton pattern prevents global scope pollution.
   *
   * @class PizzaResizer
   * @static
   */
  function PizzaResizer() {
    /**
     * This variable holds the container of all random pizzas identified by id
     * `randomPizzas`.
     *
     * @property randomPizzas
     * @type Array
     * @private
     */
    var randomPizzas = document.getElementById('randomPizzas');
    
    /**
     * This method takes a size and returns a function to be executed based on
     * the kind of resizing to do. Those are: `resizeSmall`, `resizeMedium`,
     * `resizeLarge`.
     * 
     * @method sizeSwitcher
     * @private
     * @param  size {String} A size to be matched. It can be 1, 2 or 3.
     * @return {function} A function that resizes randomPizzaContainer
     */
    function sizeSwitcher (size) {
      var classBase = 'randomPizzaContainer',
          classLarge = classBase + '--large',
          classSmall = classBase + '--small';

      switch(size) {
        case "1":
          /**
           * `resizeSmall` function is used when the user moves the slider to
           *  the __small__ position. It assigns `classSmall` to the `classList`
           *  of `DOMNode` and removes other previous class assignments.
           * 
           * @param  DOMNode {Element}
           */
          return function resizeSmall(DOMNode) {
            var classList = DOMNode.classList;
            classList.remove(classLarge);
            classList.add(classSmall);
          };
        case "2":
          /**
           * `resizeMedium` function is used when the user moves the slider to
           *  the __medium__ position. It removes any previous class assignment
           *  to `DOMNode` defaulting its size.
           * 
           * @param  DOMNode {Element}
           */
          return function resizeMedium(DOMNode) {
            var classList = DOMNode.classList;
            classList.remove(classLarge);
            classList.remove(classSmall);
          };
        case "3":
          /**
           * `resizeLarge` function is used when the user moves the slider to
           *  the __large__ position. It assigns `classLarge` to the `classList`
           *  of `DOMNode` and removes other previous class assignments.
           * 
           * @param  DOMNode {Element}
           */
          return function resizeLarge(DOMNode) {
            var classList = DOMNode.classList;
            classList.remove(classSmall);
            classList.add(classLarge);
          };
        default:
          console.log("bug in sizeSwitcher");
      }
    }

    /**
     * This method changes the text in slider's label according to the user's
     * input.
     * 
     * @method changeSliderLabel
     * @private
     * @param  size {String} A size to be matched. It can be 1, 2 or 3.
     */
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
      /**
       * This method iterates through pizza elements on the page and changes
       * their widths.
       * 
       * @method changePizzaSizes
       * @param  size {String} A size to be matched. It can be 1, 2 or 3.
       */
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
    /**
     * It returns a new instance of `PizzaResizer` if no instance exists, if
     * already instanciated, a reference to that instance is returned instead.
     * 
     * @method getInstance
     * @for PizzaResizerInstanciator
     * @return {Object} A reference to a new or already existing instance of
     * `PizzaResizer`.
     */
    getInstance: function() {
      if(!instance) {
        instance = PizzaResizer();
      }
      return instance;
    }
  };
})();
// --> END PIZZARESIZER ________________________________________________________

/**
 * A `MoverInstanciator` is used to create a unique instance of
 * `Mover`, if called more than once, the same instance is returned.
 * 
 * @class MoverInstanciator
 * @static
 */
var Mover = (function MoverInstanciator(){
  /**
   * Instance of `Mover` to be returned
   *
   * @property instance
   * @type Mover
   */
  var instance;

  /**
   * `Mover` object is a singleton object used to deal with all logic
   * related to moving pizzas in background when user scrolls.
   *
   * @class Mover
   * @static
   */
  function Mover() {
    /**
     * Iterator for number of times the pizzas in the background have scrolled.
     * Used by `updatePositions()` to decide when to log the average time per frame.
     *
     * @property frame
     * @type Integer
     * @default 0
     * @private
     */
    var frame = 0;

    // This variable holds references for .mover elements.
    /**
     * This property holds references for .mover elements.
     *
     * @property movers
     * @type Array
     * @default []
     * @private
     */
    var movers = [];

    // 
    /**
     * This method logs the average amount of time per 10 frames needed to move
     * the sliding background pizzas on scroll.
     *
     * @method logAverageFrame
     * @private
     * @param  times {Array} the array of User Timing measurements from updatePositions().
     */
    function logAverageFrame(times) {   // times is 
      var numberOfEntries = times.length;
      var sum = 0;
      for (var i = numberOfEntries - 1; i > numberOfEntries - 11; i--) {
        sum = sum + times[i].duration;
      }
      console.log("Average scripting time to generate last 10 frames: " + sum / 10 + "ms");
    }

    return {
      /**
       * This method moves the sliding background pizzas based on scroll position.
       * This code was pulled from
       * [Ilya's demo](https://www.igvita.com/slides/2012/devtools-tips-and-tricks/jank-demo.html)
       * 
       * @method updatePositions
       */
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

      /**
       * This method loads the pizzas in background
       * 
       * @method initialLoad
       */
      initialLoad: function() {
        var cols = 8,
            s = 256,
            // These variables are used to calculate how many pizzas are needed
            // to fill the current viewport's height.
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
    /**
     * It returns a new instance of `Mover` if no instance exists, if
     * already instanciated, a reference to that instance is returned instead.
     * 
     * @method getInstance
     * @for MoverInstanciator
     * @return {Object} A reference to a new or already existing instance of
     * `Mover`.
     */
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
