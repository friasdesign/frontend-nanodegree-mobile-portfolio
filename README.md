# Mobile Portfolio Optimization

This project is part of __Udacity's Front-end Nanodegree__ and is made based on [this](https://review.udacity.com/#!/rubrics/16/view) rubric.

This file describes the optimizations made in order to achieve __60fps__ most of the time, and an acceptable loading time.

## Overall Results

The following results were taken from the final built project with minified files and assets.

`/*.html` in the following sections refers to all html files in root directory as opposed to html files inside views.


|            __Marks__                     | `/views/pizza.html` | `/*.html` |
| ---------------------------------------- | ------------------- | --------- |
| Time to `DOMContentLoaded`               |               372ms |      39ms |
| Time to `DOMContentLoaded` _(throttle)_* |              3424ms |     398ms |
| Time to `load`                           |               375ms |     557ms |
| Time to `load` _(throttle)_*             |              3946ms |    3946ms |
| CRP length                               |                   1 |         2 |
| CRP size                                 |              31.1Kb |    34.1Kb |
| CRP No. resources                        |                   3 |         4 |

_* Note: throttled at Regular 2G chrome networking throttling setting._

_Note: in /*.html webfonts are used, since the browser has to do 3 more requests for fetching the data needed for first print it has a significant effect in performance. Although it's important to notice that if the css file containing the webfonts is bundled together with style.css the fonts will only be downloaded in WOFF2 format making unacessible to browsers that doesn't support that format (such as iOS safari). Google Fonts server checks User-Agent in request header and sends back the right css containing links for fonts that are supported by it._

## Optimization

### `/*.html`

The following optimizations apply to these files: `index.html`, `project-2048.html`, `project-mobile.html`, and `project-webperf.html`.

#### Loading Time

1. Placing Google Analytics logic code inside `perfmatters.js` and loading it `async` allows `load` event to be triggered faster. __280ms__ to `load` with analytics inside `perfmatters.js`, __335ms__ to `load` with analytics _inline_.
2. Shortening CSS selectors and removing unused/redundant styles from `style.css` made parse stylesheet time change from `2.25ms` to ~`3ms`, interesting because overall onload time has been down to ~800ms from 1600ms. This could be due to a decreased recalculate style time.

### `/views/`

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
In order to optimize this issue, a _singleton pattern_ have been used to create an object which holds all functions used for resizing pizzas. This singleton, named `PizzaResizer`, is instanciated only once after `DOMContentLoaded` event, so those functions are available as methods inside `PizzaResizer`.

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
The general main issue with PizzaResize is __Forced Asynchronous Layout__, in order to restore the _CRP_ (Critical Rendering Path) sequential order the styles former applied directly to the DOM node (via JS) are now grouped together in corresponding CSS classes, leaving JS for simply toggling classes as needed.

The classes are:
 - `randomPizzaContainer--small`. Sets the `width` property to _25%_.
 - `randomPizzaContainer--large`. Sets the `width` property to _50%_.
 - `randomPizzaContainer`. __Default__.Sets the `width` property to _33.3%_.

In timeline the results show that JS code is executed first, once finished _CRP_ order is followed, calling __Recalculate Styles__, then __Layout__, and __Paint__.

The results are astonishing, iterating over the _Singleton optimization_, the following are the results:

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
A singleton, named `Mover`, has been created for wrapping all methods related. __No significant improve__ in performance have been seen using this pattern, but code is now __modularized__ with a __cleaner global__ scope.

#### Animation Frame and Batching

Analyzing the Timeline, FSL(Forced Synchronous Layout) has been seen whenever `updatePositions` method was executed. The following measures has been taken for overcoming this issue:
1. Execute `updatePositions` method first in a frame, using `requestAnimationFrame()`. This allows JS code to reach calculated __layout__ from previous frame.
2. `document.body.scrollTop` moved to the top of the function. This forced __layout__ to be recalculated each for loop iteration.

This optimization shown the following results:

| __Marks__ | __Vanilla__ | __Singleton__ | __Class Optimization__ |
| --------- | ----------- | ------------- | ---------------------- |
| 1st       |        91ms |          88ms |                    3ms |
| 2nd       |        62ms |          60ms |                    2ms |
| 3rd       |        62ms |          56ms |                    3ms |
| 4th       |        60ms |          60ms |                    2ms |
| 5th       |        60ms |          65ms |                    2ms |
| _Average_ |      _67ms_ |        _66ms_ |                  _2ms_ |

Used [this](https://developers.google.com/web/fundamentals/performance/rendering/avoid-large-complex-layouts-and-layout-thrashing#avoid-forced-synchronous-layouts) link as reference.

### A single CSS file

The original `bootstrap-grid.css` file containing bootstrap grid system has been transformed into a __SASS partial__ named `_grid.scss` this partial is required inside the main `style.scss` to be added when __SASS pre-compiler__ runs, this way CRP Number of critical resources is shortened to 3 files instead of 4.
Although the results are indeedly interesting:

__Time to DOMContentLoaded (1 CSS file)__

| __Marks__ | __No-throttle__ | __Regular 2G__ |
| --------- | --------------- | -------------- |
| 1st       |           344ms |         3330ms |
| 2nd       |           352ms |         3470ms |
| 3rd       |           385ms |         3450ms |
| 4th       |           372ms |         3410ms |
| 5th       |           406ms |         3460ms |
| _Average_ |         _372ms_ |       _3424ms_ |

__Time to DOMContentLoaded (2 CSS files)__

| __Marks__ | __No-throttle__ | __Regular 2G__ |
| --------- | --------------- | -------------- |
| 1st       |           397ms |         2440ms |
| 2nd       |           459ms |         2430ms |
| 3rd       |           472ms |         2440ms |
| 4th       |           358ms |         2410ms |
| 5th       |           418ms |         2430ms |
| _Average_ |         _421ms_ |       _2430ms_ |

As shown above, there is almost 1 second of difference in slow connections for the 2 CSS files pattern this could be due to parallel download made by Google Chrome, so _making requests and downloading CSS files in parallel seems to work better for slow connections_; __Recalculate Styles__ is called once both files are already downloaded and parsed.

__Time to download CSS files (No-throttle)__

| __Marks__ | __1 CSS__ | __2 CSS__ |
| --------- | --------- | --------- |
| 1st       |      21ms |      55ms |
| 2nd       |      15ms |      30ms |
| 3rd       |      17ms |      44ms |
| 4th       |      17ms |      39ms |
| 5th       |      13ms |      33ms |
| _Average_ |    _17ms_ |    _40ms_ |

__Time to download CSS files (Regular 2G)__

| __Marks__ | __1 CSS__ | __2 CSS__ |
| --------- | --------- | --------- |
| 1st       |    1010ms |     677ms |
| 2nd       |     996ms |     674ms |
| 3rd       |    1010ms |     677ms |
| 4th       |    1010ms |     678ms |
| 5th       |    1000ms |     677ms |
| _Average_ |  _1005ms_ |   _677ms_ |

__IMPORTANT:__ The file has to be big enough to justify another request to the server. In this case the files are kept together into a single one. It's, in fact, such a chore to keep track of every single file and consider whether or not it's worth another request without using a module bundler such as __webpack__ for automation.
