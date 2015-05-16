describe("Classes are defined", function() {
  it("expects Entities namespace to be defined", function() {
    expect(Entities).not.toBe(undefined);
    expect(Entities).not.toBe(null);
  });
  
  it("expects the world class to be defined", function() {
    expect(typeof Entities.World).toBe('function');
  });
  
  it("expects the system manager class to be defined", function() {
    expect(typeof Entities.SystemManager).toBe('function');
  });
  
  it("expects the event handler class to be defined", function() {
    expect(typeof Entities.EventHandler).toBe('function');
  });
  
  it("expects the entity factory class to be defined", function() {
    expect(typeof Entities.EntityFactory).toBe('function');
  });
  
  it("expects the entity manager class to be defined", function() {
    expect(typeof Entities.EntityManager).toBe('function');
  });
});