function text_change(e) {
    $('#id_fuzzy').attr('checked', false);
}

function mt_set(txt) {
    $('#id_target').text(txt);
    $('#id_fuzzy').attr('checked', true);
}

var loading = 0;

function inc_loading() {
    if (loading == 0) {
        $('#loading').show();
    }
    loading++;
}

function dec_loading() {
    loading--;
    if (loading == 0) {
        $('#loading').hide();
    }
}

function get_source_string(callback) {
    inc_loading();
    $.get("/js/get/" + $('#id_checksum').attr('value') + '/', function(data) {
        callback(data);
        dec_loading();
    });
}

function add_translate_button(id, text, callback) {
    $('#copy-text').after('<a href="#" id="translate-' + id + '">' + text + '</a>');
    $('#translate-' + id).button({text: true, icons: { primary: "ui-icon-shuffle" }}).click(callback);
}

function load_translate_apis() {
    if (typeof(apertium) != 'undefined' && apertium.isTranslatablePair('en', target_language)) {
        add_translate_button('apertium', gettext('Translate using Apertium'), function () {
            get_source_string(function(data) {
                inc_loading();
                apertium.translate(data, 'en', target_language, function (ret) {
                    if (!ret.error) {
                        mt_set(ret.translation);
                    }
                    dec_loading();
                });
            });
            return false;
        });
    }
    if (typeof(Microsoft) != 'undefined') {
        var langs = Microsoft.Translator.getLanguages();
        if (langs.indexOf(target_language) != -1) {
            add_translate_button('microsoft', gettext('Translate using Microsoft Translator'), function () {
                get_source_string(function(data) {
                    inc_loading();
                    Microsoft.Translator.translate(data, 'en', target_language, function (ret) {
                        mt_set(ret);
                        dec_loading();
                    });
                });
                return false;
            });
        }
    }
    add_translate_button('mymemory', gettext('Translate using MyMemory'), function () {
        get_source_string(function(data) {
            inc_loading();
            $.getJSON("http://mymemory.translated.net/api/get?q=" + data + "&langpair=en|" + target_language, function(data) {
                if (data.responseData != '') {
                    mt_set(data.responseData.translatedText);
                }
                dec_loading();
            });
        });
    });
}

$(function() {
    $('.button').button();
    $('ul.menu li a').button();
    $('ul.breadcums').buttonset();
    $('div.progress').each(function f(i, e) {e = $(e); e.progressbar({ value: parseInt(e.attr('id')) })});
    $('.accordion').accordion();
    $('.errorlist').addClass('ui-state-error ui-corner-all');
    $('.sug-accept').button({text: false, icons: { primary: "ui-icon-check" }});
    $('.sug-delete').button({text: false, icons: { primary: "ui-icon-close" }});
    $('.navi').buttonset();
    $('.button-first').button({text: false, icons: { primary: "ui-icon-seek-first" }});
    $('.button-next').button({text: false, icons: { primary: "ui-icon-seek-next" }});
    $('.button-prev').button({text: false, icons: { primary: "ui-icon-seek-prev" }});
    $('.button-end').button({text: false, icons: { primary: "ui-icon-seek-end" }});
    $('textarea.translation').change(text_change).keypress(text_change).autogrow().focus();
    $('#copy-text').button({text: true, icons: { primary: "ui-icon-arrow-1-s" }}).click(function f() {
        get_source_string(function(data) {
            mt_set(data);
        });
        return false;
    });
    if (typeof(target_language) != 'undefined') {
        load_translate_apis();
    }
    $('.ignorecheck').button({text: false, icons: { primary: "ui-icon-close" }}).click(function () {
        var parent_id = $(this).parent()[0].id;
        var check_id = parent_id.substring(6);
        $.get('/js/ignore-check/' + check_id + '/', function() {
            $('#' + parent_id).remove();
        });
    });
});
