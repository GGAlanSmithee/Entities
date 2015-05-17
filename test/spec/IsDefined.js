describe('Classes are defined', function() {
  it('expects the Entities namespace to be defined as an object', function() {
    expect(typeof Entities).toBe('object');
  });
  
  it('expects the world class to be defined as a function', function() {
    expect(typeof Entities.World).toBe('function');
  });
  
  it('expects the system manager class to be defined as a function', function() {
    expect(typeof Entities.SystemManager).toBe('function');
  });
  
  it('expects the event handler class to be defined as a function', function() {
    expect(typeof Entities.EventHandler).toBe('function');
  });
  
  it('expects the entity factory class to be defined as a function', function() {
    expect(typeof Entities.EntityFactory).toBe('function');
  });
  
  it('expects the entity manager class to be defined', function() {
    expect(typeof Entities.EntityManager).toBe('function');
  });
});