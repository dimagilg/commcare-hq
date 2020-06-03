/*
 *  Handles inactvitiy timeout UI: a modal containing an iframe with the login screen,
 *  allowing users to re-login without leaving the page and losing their work.
 */
hqDefine('hqwebapp/js/inactivity', [
    'jquery',
    'underscore',
    'hqwebapp/js/initial_page_data',
], function (
    $,
    _,
    initialPageData
) {
    var log = function (message) {
        console.log("[" + (new Date()).toLocaleTimeString() + "] " + message);
    };

    $(function () {
        var timeout = initialPageData.get('secure_timeout') * 60 * 1000,    // convert from minutes to milliseconds
            $modal = $("#inactivityModal"),     // won't be present on app preview or pages without a domain
            $warningModal = $("#inactivityWarningModal");

        // Avoid popping up the warning modal when the user is actively doing something with the keyboard or mouse.
        // The keyboardOrMouseActive flag is turned on whenever a keypress or mousemove is detected, then turned
        // off when there's a 0.5-second break. This is controlled by the kepress/mousemove handlers farther down.
        // The shouldShowWarning flag is active if the user's session is 2 minutes from expiring, but keyboard or
        // mouse activity is preventing us from actually showing it. It'll be shown at the next 0.5-sec break.
        var keyboardOrMouseActive = false,
            shouldShowWarning = false;

log("page loaded, timeout length is " + timeout / 1000 / 60 + " minutes");
        if (timeout === undefined || !$modal.length) {
log("couldn't find popup or no timeout was set, therefore returning early")
            return;
        }

        /**
          * Determine when to poll next. Poll more frequently as expiration approaches, to
          * increase the chance the modal pops up before the user takes an action and gets rejected.
          */
        var calculateDelayAndWarn = function (lastRequest) {
            var millisLeft = timeout;
            if (lastRequest) {
                millisLeft = timeout - (new Date() - new Date(lastRequest));
log("last request was " + lastRequest + ", so there are " + (millisLeft / 1000 / 60) + " minutes left in the session");
            } else {
log("no last request, so there are " + (millisLeft / 1000 / 60) + " minutes left in the session");
            }

            // Last 30 seconds, ping every 3 seconds
            if (millisLeft < 30 * 1000) {
log("show warning and poll again in 3 sec");
                showWarningModal();
                return 3000;
            }

            // Last 2 minutes, ping every ten seconds
            if (millisLeft < 2 * 60 * 1000) {
log("show warning and poll again in 10 sec");
                showWarningModal();
                return 10 * 1000;
            }

            // We have time, ping when 2 minutes from expiring
log("poll again in " + (millisLeft - 2 * 60 * 1000) / 1000 / 60 + " minutes");
            return millisLeft - 2 * 60 * 1000;
        };

        var showWarningModal = function () {
            if (keyboardOrMouseActive) {
                // Can't show the popup because user is working, but set a flag
                // that will be checked when they stop typing/mousemoving.
                shouldShowWarning = true;
            } else {
                shouldShowWarning = false;
                $warningModal.modal('show');
            }
        };

        var hideWarningModal = function (showLogin) {
            $warningModal.modal('hide');
            if (showLogin) {
                $modal.modal({backdrop: 'static', keyboard: false});
            }
            // This flag should already have been turned off when the warning modal was shown,
            // but just in case, make sure it's really off. Wait until the modal is fully hidden
            // to avoid issues with code trying to re-show this popup just as we're closing it.
            shouldShowWarning = false;
        };

        var pollToShowModal = function () {
log("polling HQ's ping_login to decide about showing modal");
            $.ajax({
                url: initialPageData.reverse('ping_login'),
                type: 'GET',
                success: function (data) {
                    if (!data.success) {
log("ping_login failed, showing login modal");
                        var $body = $modal.find(".modal-body");
                        var src = initialPageData.reverse('iframe_login');
                        src += "?next=" + initialPageData.reverse('iframe_login_new_window');
                        src += "&username=" + initialPageData.get('secure_timeout_username');
                        $modal.on('shown.bs.modal', function () {
                            var content = _.template('<iframe src="<%= src %>" height="<%= height %>" width="<%= width %>" style="border: none;"></iframe>')({
                                src: src,
                                width: $body.width(),
                                height: $body.height() - 10,
                            });
                            $body.html(content);
                            $body.find("iframe").on("load", pollToHideModal);
                        });
                        $body.html('<h1 class="text-center"><i class="fa fa-spinner fa-spin"></i></h1>');
                        hideWarningModal(true);
                    } else {
log("ping_login succeeded, time to re-calculate when the next poll should be, data was " + JSON.stringify(data));
                        _.delay(pollToShowModal, calculateDelayAndWarn(data.last_request));
                    }
                },
            });
        };

        var pollToHideModal = function (e) {
log("polling HQ's ping_login to decide about hiding modal");
            var $button = $(e.currentTarget);
            $button.disableButton();
            $.ajax({
                url: initialPageData.reverse('ping_login'),
                type: 'GET',
                success: function (data) {
                    $button.enableButton();
                    var error = "";
                    if (data.success) {
                        if (data.username !== initialPageData.get('secure_timeout_username')) {
                            error = gettext(_.template("Please log in as <%= username %>"))({
                                username: initialPageData.get('secure_timeout_username'),
                            });
                        }
                    } else {
                        error = gettext("Could not authenticate, please log in and try again");
                    }

                    if (error) {
                        $button.removeClass("btn-default").addClass("btn-danger");
                        $button.text(error);
                    } else {
                        $modal.modal('hide');
                        $button.text(gettext("Done"));
                        _.delay(pollToShowModal, calculateDelayAndWarn());
                    }
                },
            });
        };

        var extendSession = function ($button) {
log("extending session");
            if ($button) {
                $button.disableButton();
            }
            shouldShowWarning = false;
            $.ajax({
                url: initialPageData.reverse('ping_session'),  // View that will trigger session activity
                type: 'GET',
                success: function () {
                    if ($button) {
                        $button.enableButton();
                    }
                    hideWarningModal();
log("session successfully extended, hiding warning popup if it's open");
                },
            });
        };

        $modal.find(".modal-footer .dismiss-button").click(pollToHideModal);
        $warningModal.find(".modal-footer .dismiss-button").click(function (e) {
            extendSession($(e.currentTarget));
        });
        $warningModal.on('shown.bs.modal', function () {
            $warningModal.find(".btn-primary").focus();
        });

        // Keep track of when user is actively typing
        $("body").on("keypress mousemove", _.throttle(function () {
            keyboardOrMouseActive = true;
        }, 100, {trailing: false}));
        $("body").on("keypress mousemove", _.debounce(function () {
            keyboardOrMouseActive = false;
            if (shouldShowWarning) {
                showWarningModal();
            }
        }, 500));

        // Send no-op request to server to extend session when there's client-side user activity on this page.
        // _.throttle will prevent this from happening too often.
        var keepAliveTimeout = 60 * 1000;
log("page loaded, will send a keep-alive request to server every click/keypress, at most once every " + (keepAliveTimeout / 1000 / 60) + " minutes");
        $("body").on("keypress click", _.throttle(function () {
            extendSession();
        }, keepAliveTimeout));

        // Start polling
        _.delay(pollToShowModal, calculateDelayAndWarn());
    });

    return 1;
});