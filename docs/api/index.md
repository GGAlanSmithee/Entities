# API

GG-Entities is built with ease-of-use, composition and performance in mind.
In order to be as performant as possible, the library allocates memory eagerly. This makes adding / removing components super fast, but puts the responsibility of memory-usage on you, the user. In an upcomming version there will probably be a settings for making the system lazy.

The entire GG-Entities API surface consists of one class, the `EntityManager`. This class is reponsible for handling everything from entity creation to system invocation and more. While the actual implementation is split into other self-contained components, this is to be considered a private implementation detail.

## Entity Manager

todo...