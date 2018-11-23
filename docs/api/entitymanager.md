

# Class: EntityManager

## Hierarchy

**EntityManager**

## Index

### Constructors

* [constructor](_index_d_._gg_entities_.entitymanager.md#constructor)

### Properties

* [capacity](_index_d_._gg_entities_.entitymanager.md#capacity)
* [components](_index_d_._gg_entities_.entitymanager.md#components)
* [entities](_index_d_._gg_entities_.entitymanager.md#entities)
* [entityConfigurations](_index_d_._gg_entities_.entitymanager.md#entityconfigurations)

### Methods

* [addComponent](_index_d_._gg_entities_.entitymanager.md#addcomponent)
* [build](_index_d_._gg_entities_.entitymanager.md#build)
* [create](_index_d_._gg_entities_.entitymanager.md#create)
* [deleteEntity](_index_d_._gg_entities_.entitymanager.md#deleteentity)
* [getEntitiesByComponents](_index_d_._gg_entities_.entitymanager.md#getentitiesbycomponents)
* [getEntitiesByIds](_index_d_._gg_entities_.entitymanager.md#getentitiesbyids)
* [getEntity](_index_d_._gg_entities_.entitymanager.md#getentity)
* [hasComponent](_index_d_._gg_entities_.entitymanager.md#hascomponent)
* [increaseCapacity](_index_d_._gg_entities_.entitymanager.md#increasecapacity)
* [listen](_index_d_._gg_entities_.entitymanager.md#listen)
* [newEntity](_index_d_._gg_entities_.entitymanager.md#newentity)
* [onInit](_index_d_._gg_entities_.entitymanager.md#oninit)
* [onLogic](_index_d_._gg_entities_.entitymanager.md#onlogic)
* [onRender](_index_d_._gg_entities_.entitymanager.md#onrender)
* [registerComponent](_index_d_._gg_entities_.entitymanager.md#registercomponent)
* [registerConfiguration](_index_d_._gg_entities_.entitymanager.md#registerconfiguration)
* [registerInitSystem](_index_d_._gg_entities_.entitymanager.md#registerinitsystem)
* [registerInitializer](_index_d_._gg_entities_.entitymanager.md#registerinitializer)
* [registerLogicSystem](_index_d_._gg_entities_.entitymanager.md#registerlogicsystem)
* [registerRenderSystem](_index_d_._gg_entities_.entitymanager.md#registerrendersystem)
* [registerSystem](_index_d_._gg_entities_.entitymanager.md#registersystem)
* [removeComponent](_index_d_._gg_entities_.entitymanager.md#removecomponent)
* [removeSystem](_index_d_._gg_entities_.entitymanager.md#removesystem)
* [stopListen](_index_d_._gg_entities_.entitymanager.md#stoplisten)
* [trigger](_index_d_._gg_entities_.entitymanager.md#trigger)
* [triggerDelayed](_index_d_._gg_entities_.entitymanager.md#triggerdelayed)
* [withComponent](_index_d_._gg_entities_.entitymanager.md#withcomponent)
* [withData](_index_d_._gg_entities_.entitymanager.md#withdata)

---

## Constructors

<a id="constructor"></a>

###  constructor

⊕ **new EntityManager**(capacity?: * `undefined` &#124; `number`*): [EntityManager](_index_d_._gg_entities_.entitymanager.md)

*Defined in [index.d.ts:31](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L31)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| `Optional` capacity |  `undefined` &#124; `number`|

**Returns:** [EntityManager](_index_d_._gg_entities_.entitymanager.md)

___

## Properties

<a id="capacity"></a>

###  capacity

**● capacity**: *`number`*

*Defined in [index.d.ts:34](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L34)*

___
<a id="components"></a>

###  components

**● components**: *`Map`<[ComponentKey](../modules/_index_d_._gg_entities_.md#componentkey), [Component](../modules/_index_d_._gg_entities_.md#component)>*

*Defined in [index.d.ts:36](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L36)*

___
<a id="entities"></a>

###  entities

**● entities**: *[EntityArray](../modules/_index_d_._gg_entities_.md#entityarray)*

*Defined in [index.d.ts:35](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L35)*

___
<a id="entityconfigurations"></a>

###  entityConfigurations

**● entityConfigurations**: *`Map`<[ConfigurationKey](../modules/_index_d_._gg_entities_.md#configurationkey), [Configuration](../modules/_index_d_._gg_entities_.md#configuration)>*

*Defined in [index.d.ts:37](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L37)*

___

## Methods

<a id="addcomponent"></a>

###  addComponent

▸ **addComponent**(entityId: *[EntityId](../modules/_index_d_._gg_entities_.md#entityid)*, component: *[ComponentKey](../modules/_index_d_._gg_entities_.md#componentkey)*): `void`

*Defined in [index.d.ts:67](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L67)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| entityId | [EntityId](../modules/_index_d_._gg_entities_.md#entityid) |
| component | [ComponentKey](../modules/_index_d_._gg_entities_.md#componentkey) |

**Returns:** `void`

___
<a id="build"></a>

###  build

▸ **build**(): `this`

*Defined in [index.d.ts:93](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L93)*

**Returns:** `this`

___
<a id="create"></a>

###  create

▸ **create**(count?: * `undefined` &#124; `number`*, configurationKey?: *[ConfigurationKey](../modules/_index_d_._gg_entities_.md#configurationkey)*): [EntityArray](../modules/_index_d_._gg_entities_.md#entityarray)

*Defined in [index.d.ts:99](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L99)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| `Optional` count |  `undefined` &#124; `number`|
| `Optional` configurationKey | [ConfigurationKey](../modules/_index_d_._gg_entities_.md#configurationkey) |

**Returns:** [EntityArray](../modules/_index_d_._gg_entities_.md#entityarray)

___
<a id="deleteentity"></a>

###  deleteEntity

▸ **deleteEntity**(id: *[EntityId](../modules/_index_d_._gg_entities_.md#entityid)*): `void`

*Defined in [index.d.ts:46](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L46)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| id | [EntityId](../modules/_index_d_._gg_entities_.md#entityid) |

**Returns:** `void`

___
<a id="getentitiesbycomponents"></a>

###  getEntitiesByComponents

▸ **getEntitiesByComponents**(components?: *[ComponentKeyArray](../modules/_index_d_._gg_entities_.md#componentkeyarray)*): `IterableIterator`<[Entity](../modules/_index_d_._gg_entities_.md#entity)>

*Defined in [index.d.ts:57](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L57)*

Comment for method getEntitiesByComponents.

**Parameters:**

| Name | Type |
| ------ | ------ |
| `Optional` components | [ComponentKeyArray](../modules/_index_d_._gg_entities_.md#componentkeyarray) |

**Returns:** `IterableIterator`<[Entity](../modules/_index_d_._gg_entities_.md#entity)>
Comment for return value.

___
<a id="getentitiesbyids"></a>

###  getEntitiesByIds

▸ **getEntitiesByIds**(ids?: *[EntityIdArray](../modules/_index_d_._gg_entities_.md#entityidarray)*): `IterableIterator`<[Entity](../modules/_index_d_._gg_entities_.md#entity)>

*Defined in [index.d.ts:59](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L59)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| `Optional` ids | [EntityIdArray](../modules/_index_d_._gg_entities_.md#entityidarray) |

**Returns:** `IterableIterator`<[Entity](../modules/_index_d_._gg_entities_.md#entity)>

___
<a id="getentity"></a>

###  getEntity

▸ **getEntity**(id: *[EntityId](../modules/_index_d_._gg_entities_.md#entityid)*):  [Entity](../modules/_index_d_._gg_entities_.md#entity) &#124; `null`

*Defined in [index.d.ts:48](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L48)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| id | [EntityId](../modules/_index_d_._gg_entities_.md#entityid) |

**Returns:**  [Entity](../modules/_index_d_._gg_entities_.md#entity) &#124; `null`

___
<a id="hascomponent"></a>

###  hasComponent

▸ **hasComponent**(id: *[EntityId](../modules/_index_d_._gg_entities_.md#entityid)*, component: *[ComponentKey](../modules/_index_d_._gg_entities_.md#componentkey)*): `boolean`

*Defined in [index.d.ts:50](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L50)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| id | [EntityId](../modules/_index_d_._gg_entities_.md#entityid) |
| component | [ComponentKey](../modules/_index_d_._gg_entities_.md#componentkey) |

**Returns:** `boolean`

___
<a id="increasecapacity"></a>

###  increaseCapacity

▸ **increaseCapacity**(): `void`

*Defined in [index.d.ts:42](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L42)*

Increases the capacity (number of max entities) by a factor of 2

**Returns:** `void`

___
<a id="listen"></a>

###  listen

▸ **listen**(event: *[EventKey](../modules/_index_d_._gg_entities_.md#eventkey)*, callback: *[EventCallback](../modules/_index_d_._gg_entities_.md#eventcallback)*): `number`

*Defined in [index.d.ts:103](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L103)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| event | [EventKey](../modules/_index_d_._gg_entities_.md#eventkey) |
| callback | [EventCallback](../modules/_index_d_._gg_entities_.md#eventcallback) |

**Returns:** `number`

___
<a id="newentity"></a>

###  newEntity

▸ **newEntity**(components: *[ComponentKeyArray](../modules/_index_d_._gg_entities_.md#componentkeyarray)*, data?: * `undefined` &#124; `object`*):  [Entity](../modules/_index_d_._gg_entities_.md#entity) &#124; `null`

*Defined in [index.d.ts:44](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L44)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| components | [ComponentKeyArray](../modules/_index_d_._gg_entities_.md#componentkeyarray) |
| `Optional` data |  `undefined` &#124; `object`|

**Returns:**  [Entity](../modules/_index_d_._gg_entities_.md#entity) &#124; `null`

___
<a id="oninit"></a>

###  onInit

▸ **onInit**(opts?: * `undefined` &#124; `object`*): `void`

*Defined in [index.d.ts:87](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L87)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| `Optional` opts |  `undefined` &#124; `object`|

**Returns:** `void`

___
<a id="onlogic"></a>

###  onLogic

▸ **onLogic**(opts?: * `undefined` &#124; `object`*): `void`

*Defined in [index.d.ts:83](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L83)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| `Optional` opts |  `undefined` &#124; `object`|

**Returns:** `void`

___
<a id="onrender"></a>

###  onRender

▸ **onRender**(opts?: * `undefined` &#124; `object`*): `void`

*Defined in [index.d.ts:85](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L85)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| `Optional` opts |  `undefined` &#124; `object`|

**Returns:** `void`

___
<a id="registercomponent"></a>

###  registerComponent

▸ **registerComponent**(key: *[ComponentKey](../modules/_index_d_._gg_entities_.md#componentkey)*, component: *[Component](../modules/_index_d_._gg_entities_.md#component)*): `void`

*Defined in [index.d.ts:65](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L65)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| key | [ComponentKey](../modules/_index_d_._gg_entities_.md#componentkey) |
| component | [Component](../modules/_index_d_._gg_entities_.md#component) |

**Returns:** `void`

___
<a id="registerconfiguration"></a>

###  registerConfiguration

▸ **registerConfiguration**(key: *[ConfigurationKey](../modules/_index_d_._gg_entities_.md#configurationkey)*): `void`

*Defined in [index.d.ts:61](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L61)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| key | [ConfigurationKey](../modules/_index_d_._gg_entities_.md#configurationkey) |

**Returns:** `void`

___
<a id="registerinitsystem"></a>

###  registerInitSystem

▸ **registerInitSystem**(key: *[SystemKey](../modules/_index_d_._gg_entities_.md#systemkey)*, components: *[ComponentKeyArray](../modules/_index_d_._gg_entities_.md#componentkeyarray)*, callback: *[SystemCallback](../modules/_index_d_._gg_entities_.md#systemcallback)*): `void`

*Defined in [index.d.ts:79](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L79)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| key | [SystemKey](../modules/_index_d_._gg_entities_.md#systemkey) |
| components | [ComponentKeyArray](../modules/_index_d_._gg_entities_.md#componentkeyarray) |
| callback | [SystemCallback](../modules/_index_d_._gg_entities_.md#systemcallback) |

**Returns:** `void`

___
<a id="registerinitializer"></a>

###  registerInitializer

▸ **registerInitializer**(component: *[ComponentKey](../modules/_index_d_._gg_entities_.md#componentkey)*, initializer: *[ComponentInitializer](../modules/_index_d_._gg_entities_.md#componentinitializer)*): `void`

*Defined in [index.d.ts:91](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L91)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| component | [ComponentKey](../modules/_index_d_._gg_entities_.md#componentkey) |
| initializer | [ComponentInitializer](../modules/_index_d_._gg_entities_.md#componentinitializer) |

**Returns:** `void`

___
<a id="registerlogicsystem"></a>

###  registerLogicSystem

▸ **registerLogicSystem**(key: *[SystemKey](../modules/_index_d_._gg_entities_.md#systemkey)*, components: *[ComponentKeyArray](../modules/_index_d_._gg_entities_.md#componentkeyarray)*, callback: *[SystemCallback](../modules/_index_d_._gg_entities_.md#systemcallback)*): `void`

*Defined in [index.d.ts:75](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L75)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| key | [SystemKey](../modules/_index_d_._gg_entities_.md#systemkey) |
| components | [ComponentKeyArray](../modules/_index_d_._gg_entities_.md#componentkeyarray) |
| callback | [SystemCallback](../modules/_index_d_._gg_entities_.md#systemcallback) |

**Returns:** `void`

___
<a id="registerrendersystem"></a>

###  registerRenderSystem

▸ **registerRenderSystem**(key: *[SystemKey](../modules/_index_d_._gg_entities_.md#systemkey)*, components: *[ComponentKeyArray](../modules/_index_d_._gg_entities_.md#componentkeyarray)*, callback: *[SystemCallback](../modules/_index_d_._gg_entities_.md#systemcallback)*): `void`

*Defined in [index.d.ts:77](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L77)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| key | [SystemKey](../modules/_index_d_._gg_entities_.md#systemkey) |
| components | [ComponentKeyArray](../modules/_index_d_._gg_entities_.md#componentkeyarray) |
| callback | [SystemCallback](../modules/_index_d_._gg_entities_.md#systemcallback) |

**Returns:** `void`

___
<a id="registersystem"></a>

###  registerSystem

▸ **registerSystem**(type: *[SystemType](../enums/_index_d_._gg_entities_.systemtype.md)*, key: *[SystemKey](../modules/_index_d_._gg_entities_.md#systemkey)*, components: *[ComponentKeyArray](../modules/_index_d_._gg_entities_.md#componentkeyarray)*, callback: *[SystemCallback](../modules/_index_d_._gg_entities_.md#systemcallback)*): `void`

*Defined in [index.d.ts:73](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L73)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| type | [SystemType](../enums/_index_d_._gg_entities_.systemtype.md) |
| key | [SystemKey](../modules/_index_d_._gg_entities_.md#systemkey) |
| components | [ComponentKeyArray](../modules/_index_d_._gg_entities_.md#componentkeyarray) |
| callback | [SystemCallback](../modules/_index_d_._gg_entities_.md#systemcallback) |

**Returns:** `void`

___
<a id="removecomponent"></a>

###  removeComponent

▸ **removeComponent**(entityId: *[EntityId](../modules/_index_d_._gg_entities_.md#entityid)*, component: *[ComponentKey](../modules/_index_d_._gg_entities_.md#componentkey)*): `void`

*Defined in [index.d.ts:69](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L69)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| entityId | [EntityId](../modules/_index_d_._gg_entities_.md#entityid) |
| component | [ComponentKey](../modules/_index_d_._gg_entities_.md#componentkey) |

**Returns:** `void`

___
<a id="removesystem"></a>

###  removeSystem

▸ **removeSystem**(key: *[SystemKey](../modules/_index_d_._gg_entities_.md#systemkey)*): `boolean`

*Defined in [index.d.ts:81](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L81)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| key | [SystemKey](../modules/_index_d_._gg_entities_.md#systemkey) |

**Returns:** `boolean`

___
<a id="stoplisten"></a>

###  stopListen

▸ **stopListen**(eventId: *[EventId](../modules/_index_d_._gg_entities_.md#eventid)*): `boolean`

*Defined in [index.d.ts:105](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L105)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| eventId | [EventId](../modules/_index_d_._gg_entities_.md#eventid) |

**Returns:** `boolean`

___
<a id="trigger"></a>

###  trigger

▸ **trigger**(event: *[EventKey](../modules/_index_d_._gg_entities_.md#eventkey)*, opts?: * `undefined` &#124; `object`*): `Promise`<`any`>

*Defined in [index.d.ts:107](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L107)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| event | [EventKey](../modules/_index_d_._gg_entities_.md#eventkey) |
| `Optional` opts |  `undefined` &#124; `object`|

**Returns:** `Promise`<`any`>

___
<a id="triggerdelayed"></a>

###  triggerDelayed

▸ **triggerDelayed**(event: *[EventKey](../modules/_index_d_._gg_entities_.md#eventkey)*, timeout: *`number`*, opts?: * `undefined` &#124; `object`*): `Promise`<`any`>

*Defined in [index.d.ts:109](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L109)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| event | [EventKey](../modules/_index_d_._gg_entities_.md#eventkey) |
| timeout | `number` |
| `Optional` opts |  `undefined` &#124; `object`|

**Returns:** `Promise`<`any`>

___
<a id="withcomponent"></a>

###  withComponent

▸ **withComponent**(component: *[ComponentKey](../modules/_index_d_._gg_entities_.md#componentkey)*, initializer?: *[ComponentInitializer](../modules/_index_d_._gg_entities_.md#componentinitializer)*): `this`

*Defined in [index.d.ts:95](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L95)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| component | [ComponentKey](../modules/_index_d_._gg_entities_.md#componentkey) |
| `Optional` initializer | [ComponentInitializer](../modules/_index_d_._gg_entities_.md#componentinitializer) |

**Returns:** `this`

___
<a id="withdata"></a>

###  withData

▸ **withData**(data: *`object`*): `this`

*Defined in [index.d.ts:97](https://github.com/GGAlanSmithee/Entities/blob/5fd9392/src/index.d.ts#L97)*

**Parameters:**

| Name | Type |
| ------ | ------ |
| data | `object` |

**Returns:** `this`

___

