# Mobile Portfolio Optimization

This project is part of **Udacity's Front-end Nanodegree** and is made based on [this](https://review.udacity.com/#!/rubrics/16/view) rubric.

This file describes the optimizations made in order to achieve **60fps** most of the time, and an acceptable loading time.

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

#### Animation Frame and Batching

Analyzing the Timeline, FSL(Forced Synchronous Layout) has been seen whenever `updatePositions` method was executed. The following measures has been taken for overcoming this issue:
1. Execute `updatePositions` method first in a frame, using `requestAnimationFrame()`. This allows JS code to reach calculated **layout** from previous frame.
2. `document.body.scrollTop` moved to the top of the function. This forced **layout** to be recalculated each for loop iteration.

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
