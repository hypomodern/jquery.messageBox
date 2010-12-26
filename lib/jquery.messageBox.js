// jQuery-style messenger, for triggering notifications programmatically via javascript.
// this is designed to be extendible: I'd like to be able to trigger pushdowns & flash-messages.
//
// Requires: jquery closure plugin (very small): [code here](http://code.abnoctus.com/jclosure/doc/)
//
// Setting up the Display:
//
//      jQuery("#your_message_container").messageBox({
//        messageTypes: [ 'notices', 'alerts' ],  // a list of message types
//        template: my_template_object,           // a template object
//        insertion: {                            // optional
//          method: "prependTo",                  // You might also try "appendTo"
//          fade: 1000                            // choose any length or false
//        }
//      });
//
// The template object might be from underscore or somethin'. It needs to be directly callable, so
// if you wanna use Mustache.js for your templates, you'll have to make a curry:
//
//      function soupcatcher(template) {
//        return function(data) {
//          return Mustache.to_html(template, data);
//        }
//      }
//
// then you go:
//
//      jQuery(...).messageBox({
//        template: soupcatcher(template),
//        ...
//      });
//
// ...and all is well.
//
// #### Sending Notifications:
// You'll want to use jQuery's custom event mechanism to trigger `message:sent` events with a custom event object.
// Here's how it should look:
//
//      jQuery("#my_message_emitter").trigger({
//        type: "message:sent",
//        messageType: "notice",                  // or whatever
//        messageData: { foo: "bar", quux: 5 }    // ditto
//      });
//
// There's a shortcut: `jQuery.messenger(message_type, message_data);`
(function($) {

  function MessageBox(element, options) {
    this.options = options;
    this.$element = $(element);
  }
  MessageBox.prototype = {
    show: function(message) {
      this.$element.show();
      var content = this.template(message);

      // use `#[pre/app]pendTo` so that we can snag a reference to the new message...
      var message_element = $(content)[this.options.insertion.method](this.$element);

      // ... in order to hide it after a short delay, if specified:
      if(this.options.insertion.fade || this.options.insertion.fade == 0) {
        setTimeout($.closeArgs(this, this.hide, message_element), 2000);
      }

      return message;
    },
    hide: function( el ) {
      el.fadeOut(this.options.insertion.fade, function() { el.remove(); });
    },
    // indirection to the passed options, for future growth
    template: function( context ) {
      return this.options.template(context);
    },
    shouldHandleMessage: function(message_name) {
      return (this.options.messageTypes || []).indexOf(message_name) >= 0;
    }
  };

  // The PubSub channel actually does the event listening. It delegates to registered listeners.
  function PubSub(channel_name) {
    this.channel = channel_name;
    this.listeners = [];
    $(document).bind("message:sent", $.callback(this, this.receive));
    $(document).data('PubSub', this);
  }
  PubSub.prototype = {
    publish: function(message_name, data) {
      $.each(this.listeners, function(i, message_box) {
        if( message_box.shouldHandleMessage(message_name) ) {
          message_box.show( $.extend(data, { "messageType": message_name }) );
        }
      });
    },
    receive: function(e) {
      this.publish(e.messageType, e.messageData);
    },
    add_listener: function(listener) {
      this.listeners.push( listener );
      return this;
    }
  };

  // setup a new PubSub, if necessary, and
  // setup a new MessageBox and register it with the PubSub Dispatcher
  $.fn.messageBox = function(options) {
    options = $.extend(true, options, $.fn.messageBox.defaults);

    var pub_sub = $(document).data("PubSub");
    if( !pub_sub ) {
      pub_sub = new PubSub("message_box");
    }

    var message_box = new MessageBox(this, options);
    pub_sub.add_listener( message_box );

    return this;
  };

  // a shortcut, for ease of use.
  $.messenger = function(message_type, message_data) {
    $(document).trigger({
      type: "message:sent",
      messageType: message_type,
      messageData: message_data
    });
  };

  $.fn.messageBox.defaults = {
    insertion: {
      method: "prependTo",  // You might also try "appendTo"
      fade: 1000            // You can choose any length or false
    }
  };
})(jQuery);