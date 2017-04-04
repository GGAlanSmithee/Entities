# GG-Entities

_The API docs are still WIP_

## Overview

GG-Entities is built with ease-of-use, composition and performance in mind.
In order to be as performant as possible, the library allocates memory at the time of creation and release memory at the end-of-life.
This makes adding / removing components super fast, but puts the responsibility of memory-usage on you, the user.

The entire GG-Entities API surface consists of four key components

* A `ComponentManager`, which lets you register components and assign them to an entity
* A `EntityFactory`, which lets you create configurations and instatiate entities
* A `SystemManager`, which lets you add systems which operates on your entities
* A `EventHandler`, which lets you communicate between entities

While these parts are 100% independant of each other, and you can use them as stand-alone components, the intended way is to access them via a `EntityManager` instance, which aggregates all of their functionality in a cohesive way.

