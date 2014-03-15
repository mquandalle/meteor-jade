// Integration tests, template are defined in the tests/tests.jade file and
// instanciated with the following function:

var instanciate = function (tplName, data) {
  var component = UI.renderWithData(Template[tplName], data);

  // Create an invisible <div> node to render the component
  var testDiv = document.createElement("div");
  testDiv.style.display = "none";
  testDiv.className = tplName;

  // Insert the component
  UI.insert(component, testDiv);
  return component.templateInstance;
};


Tinytest.add('Jade - HTML tags', function (test) {
  var tpl = instanciate("htmlTags");
  test.isNotNull(tpl.find('h1'));
  test.isNotNull(tpl.find('h2.myClass'));
  test.isNotNull(tpl.find('h3#myId'));
  test.isNotNull(tpl.find('h4.myClass#myId'));
  test.isNotNull(tpl.find('form > input'));
  test.isNotNull(tpl.find('header > div'));
  // XXX Inline tags using the #tag[] syntax doesn't work yet
  // XXX Modify the jade parser?
  // test.isNotNull(tpl.find('p > strong'));
  // test.isNotNull(tpl.find('div > span > span'));
});

Tinytest.add('Jade - Unwrapped Text', function (test) {
  var tpl = instanciate("unwrappedText");
  // XXX I don't know why but tpl.firstNode is null
  // test.equal(tpl.firstNode.innerText, "Unwrapped text");
  test.equal(tpl.find("h1").innerText, "Hello world");
});

Tinytest.add('Jade - HTML attributes', function (test) {
  var tpl = instanciate("htmlAttributes", {
    isRequired: true,
    placeholder: "test",
    attrs: {
      required: true,
      placeholder: "test"
    }
  });
  var tpl2 = instanciate("htmlAttributes", {
    isRequired: false
  });
  test.isTrue(tpl.find("#i1").required);
  test.equal(tpl.find("#i2").type, "password");
  test.isTrue(tpl.find("#i3").required);
  test.isFalse(tpl2.find("#i3").required);
  test.isTrue(tpl.find("#i4").required);
  test.equal(tpl.find("#i4").placeholder, "test");
  // XXX Bug
  // test.isTrue(tpl.find("#i5").required);
  // test.equal(tpl.find("#i5").placeholder, "test");
  test.equal(tpl.find("div").className, "class1 class2 class3");
});

Tinytest.add('Jade - else if', function (test) {
  // XXX TBD
});

Tinytest.add('Jade - Expressions', function (test) {
  // XXX TBD
});

Tinytest.add('Jade - Components inclusion', function (test) {
  // XXX TBD
});

Tinytest.add('Jade - Components arguments', function (test) {
  // XXX TBD
});

Tinytest.add('Jade - Filters: markdown', function (test) {
  // XXX TBD
});
