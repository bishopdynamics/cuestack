taken from: [https://github.com/clvLabs/PyATEMMax](https://github.com/clvLabs/PyATEMMax)
changes made:
* ATEMCommandHandlers -> _handleSSrc: was throwing errors, so nerfed it

Hopefully the changes above wont be necessary in a future release of that package, and we can just install it via pip


![PyATEMMax](https://clvlabs.github.io/PyATEMMax/assets/images/logo.png)

## Library code

The library source code. Find more info in [the documentation](https://clvlabs.github.io/PyATEMMax/dev/).

* `ATEMBuffer`: is a buffer manager class.
* `ATEMCommandHandlers`: contains all protocol message handlers (code split from ATEMMax).
* `ATEMConnectionManager`: is the equivalent of `ATEMbase` in the original library, manages connection with the switcher.
* `ATEMConstant`: contains helpers to declare protocol constant values.
* `ATEMException`: is the exception type thrown by the library.
* `ATEMMax`: is the equivalent of `ATEMmax` in the original library. This is the main entry point to use the library.
* `ATEMProtocol`: contains constant values defined by the ATEM protocol, as well as some helper methods.
* `ATEMProtocolEnums`: contains enumerations defined by the ATEM protocol.
* `ATEMSetterMethods`: contains all setter methods for data (code split from ATEMmax).
* `ATEMSocket`: simulates the behaviour of Arduino's socket (to keep the original code as clean as possible).
* `ATEMSwitcherState`: contains all switcher state data objects (code split from ATEMmax).
* `ATEMUtils`: contains internal utility methods.
* `ATEMValueDict`: contains helpers to declare dictionaries in data classes.
* All modules in the `PyATEMMax/StateData` folder try to represent the data model of the switcher.
