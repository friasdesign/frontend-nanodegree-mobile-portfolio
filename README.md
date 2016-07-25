## Website Performance Optimization portfolio project

Your challenge, if you wish to accept it (and we sure hope you will), is to optimize this online portfolio for speed! In particular, optimize the critical rendering path and make this page render as quickly as possible by applying the techniques you've picked up in the [Critical Rendering Path course](https://www.udacity.com/course/ud884).

To get started, check out the repository and inspect the code.

### Getting started

####Part 1: Optimize PageSpeed Insights score for index.html

Some useful tips to help you get started:

1. Check out the repository
1. To inspect the site on your phone, you can run a local server

  ```bash
  $> cd /path/to/your-project-folder
  $> python -m SimpleHTTPServer 8080
  ```

1. Open a browser and visit localhost:8080
1. Download and install [ngrok](https://ngrok.com/) to the top-level of your project directory to make your local server accessible remotely.

  ``` bash
  $> cd /path/to/your-project-folder
  $> ./ngrok http 8080
  ```

1. Copy the public URL ngrok gives you and try running it through PageSpeed Insights! Optional: [More on integrating ngrok, Grunt and PageSpeed.](http://www.jamescryer.com/2014/06/12/grunt-pagespeed-and-ngrok-locally-testing/)

Profile, optimize, measure... and then lather, rinse, and repeat. Good luck!

####Part 2: Optimize Frames per Second in pizza.html

To optimize views/pizza.html, you will need to modify views/js/main.js until your frames per second rate is 60 fps or higher. You will find instructive comments in main.js. 

You might find the FPS Counter/HUD Display useful in Chrome developer tools described here: [Chrome Dev Tools tips-and-tricks](https://developer.chrome.com/devtools/docs/tips-and-tricks).

### Optimization Tips and Tricks
* [Optimizing Performance](https://developers.google.com/web/fundamentals/performance/ "web performance")
* [Analyzing the Critical Rendering Path](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/analyzing-crp.html "analyzing crp")
* [Optimizing the Critical Rendering Path](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/optimizing-critical-rendering-path.html "optimize the crp!")
* [Avoiding Rendering Blocking CSS](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/render-blocking-css.html "render blocking css")
* [Optimizing JavaScript](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/adding-interactivity-with-javascript.html "javascript")
* [Measuring with Navigation Timing](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/measure-crp.html "nav timing api"). We didn't cover the Navigation Timing API in the first two lessons but it's an incredibly useful tool for automated page profiling. I highly recommend reading.
* <a href="https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/eliminate-downloads.html">The fewer the downloads, the better</a>
* <a href="https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/optimize-encoding-and-transfer.html">Reduce the size of text</a>
* <a href="https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/image-optimization.html">Optimize images</a>
* <a href="https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching.html">HTTP caching</a>

### Customization with Bootstrap
The portfolio was built on Twitter's <a href="http://getbootstrap.com/">Bootstrap</a> framework. All custom styles are in `dist/css/portfolio.css` in the portfolio repo.

* <a href="http://getbootstrap.com/css/">Bootstrap's CSS Classes</a>
* <a href="http://getbootstrap.com/components/">Bootstrap's Components</a>


## Optimization

### `./*.html`

The following optimizations apply to these files: `index.html`, `project-2048.html`, `project-mobile.html`, and `project-webperf.html`.

#### Loading Time

1. Placing Google Analytics logic code inside `perfmatters.js` and loading it `async` allows `load` event to be triggered faster. **280ms** to `load` with analytics inside `perfmatters.js`, **335ms** to `load` with analytics *inline*.
2. Shortening CSS selectors and removing unused/redundant styles from `style.css` made parse stylesheet time change from `2.25ms` to ~`3ms`, interesting because overall onload time has been down to ~800ms from 1600ms. This could be due to a decreased recalculate style time.

### `./views/`

#### Loading Time

The following optimizations have been applied in order to optimize loading time:

##### pizzaElementGenerator (in `js/main.js`)
This generator created DOM elements with randomly named pizzas, the fact that this function also assigned inline styles to each of the DOM nodes individually before appending made it run slowly, _optimization_ applied here was to default those styles in `style.css` instead and simply add the corresponding class to each node. Here are the results:

| __Marks__ | __Vanilla__ | __Optimization__ |
| --------- | ----------- | ---------------- |
| 1st       |        80ms |             68ms |
| 2nd       |        97ms |             73ms |
| 3rd       |       138ms |             81ms |
| 4th       |        77ms |             52ms |
| 5th       |        81ms |             63ms |
| _Average_ |      _94ms_ |           _67ms_ |

#### PizzaResize

The following optimizations have been applied in order to improve pizza resizing time:

##### Singleton reengineering

In vanilla, functions were defined inside the listener, so each time the user clicked the slider (`#sizeSlider`), JS redefined functions with the same code inside.
In order to optimize this issue, I've used a *singleton pattern* to create an object which holds all functions used for resizing pizzas. This singleton, name `PizzaResizer`, is instanciated only once after `DOMContentLoaded` event, so those functions are available as methods inside `PizzaResizer`.

The following results were obtained:

| __Marks__ | __Vanilla__ | __Optimization__ |
| --------- | ----------- | ---------------- |
| 1st       |       378ms |            354ms |
| 2nd       |       376ms |            312ms |
| 3rd       |       377ms |            269ms |
| 4th       |       340ms |            257ms |
| 5th       |       424ms |            325ms |
| _Average_ |     _379ms_ |          _303ms_ |


#### Changing Classes
The general main issue with PizzaResize is Forced Asynchronous Layout, in order to restore the *CRP* (Critical Rendering Path) sequential order I came up with the idea of adding the different sizes in classes and then simply toggling the classes as needed.

The classes are:
 - `randomPizzaContainer--small`. Sets the `width` property to *25%*.
 - `randomPizzaContainer--large`. Sets the `width` property to *50%*.
 - `randomPizzaContainer`. **Default**.Sets the `width` property to *33.3%*.

In timeline the results show that JS code is executed first, once finished *CRP* order is followed, calling **Recalculate Styles**, then **Layout**, and **Paint**.

The results are astonishing, iterating over the *Singleton optimization*, the following are the results:

| __Marks__ | __Vanilla__ | __Singleton__ | __Class Optimization__ |
| --------- | ----------- | ------------- | ---------------------- |
| 1st       |       378ms |         354ms |                    4ms |
| 2nd       |       376ms |         312ms |                    4ms |
| 3rd       |       377ms |         269ms |                    4ms |
| 4th       |       340ms |         257ms |                    6ms |
| 5th       |       424ms |         325ms |                    4ms |
| _Average_ |     _379ms_ |       _303ms_ |                  _4ms_ |

### Scrolling

The main issue during scrolling is the recalculation of the position of pizzas in the background, these are optimizations that took place in order to reach better performance.

#### Singleton Pattern
A singleton, named `Mover`, has been created for wrapping all methods related. **No significant improve** in performance have been seen using this pattern, but code is now **modularized** with a **cleaner global** scope.
