# CueStack TODO List

## Near-Term
* make trigger sources populate a queue, and consume it in a separate process
* convert trigger sources to use polymorphism
    * add more trigger source types (tcp, udp, osc)
    

## Long-Term

## Ideas

* expand the api
    * add `configure` and `command` keys to incoming API `request` options
    * `configure` is used to configure a command target (or trigger source why not)
    * `command` is used to send a command directly to a command target
    * also need to query for listing command targes and input sources
    * this gives us the opportunity to dynamically configure from a separate app exclusively thru the api.
    * config should be written to file as we go