.. _continuous-translation:

Continuous localization
=======================

There is infrastructure in place so that your translation closely follows
development. This way translators can work on translations the entire time,
instead of working through huge amount of new text just prior to release.

This is the process:

1. Developers make changes and push them to the VCS repository.
2. Optionally the translation files are updated (this depends on the file format, see :ref:`translations-update`).
3. Weblate pulls changes from the VCS repository, see :ref:`update-vcs`.
4. Once Weblate detects changes in translations, translators are notified based on their subscription settings.
5. Translators submit translations using the Weblate web interface, or upload offline changes.
6. Once the translators are finished, Weblate commits the changes to the local repository (see :ref:`lazy-commit`) and pushes them back if it has permissions to do so (see :ref:`push-changes`).

.. graphviz::

    digraph translations {
        graph [fontname = "sans-serif"];
        node [fontname = "sans-serif"];
        edge [fontname = "sans-serif"];

        "Developers" [shape=box, fillcolor=seagreen, fontcolor=white, style=filled];
        "Translators" [shape=box, fillcolor=seagreen, fontcolor=white, style=filled];

        "Developers" -> "VCS repository" [label=" 1. Push "];

        "VCS repository" -> "VCS repository" [label=" 2. Updating translations ", style=dotted];

        "VCS repository" -> "Weblate" [label=" 3. Pull "];

        "Weblate" -> "Translators" [label=" 4. Notification "];

        "Translators" -> "Weblate" [label=" 5. Translate "];

        "Weblate" -> "VCS repository" [label=" 6. Push "];
    }

.. _update-vcs:

Updating repositories
---------------------

You should set up some way of updating backend repositories from their
source.

* Use :ref:`hooks` to integrate with most of common code hosting services
* Manually trigger update either in the repository management or using :ref:`api` or :ref:`wlc`
* Enable :setting:`AUTO_UPDATE` to automatically update all components on your Weblate instance
* Exectute :djadmin:`updategit` (with selection of project or `--all` to update all)

Whenever Weblate updates the repository, the post update addons will be
triggered, see :ref:`addons`.

.. _avoid-merge-conflicts:

Avoiding merge conflicts
++++++++++++++++++++++++

The merge conflicts from Weblate arise when same file was changed both in
Weblate and outside it. There are two approaches to deal with that - avoid
edits outside Weblate or integrate Weblate into your updating process, so that
it flushes changes prior to updating the files outside Weblate.

The first approach is easy with monolingual files - you can add new strings
within Weblate and leave whole editing of the files there. For bilingual files,
there is usually some kind of message extraction process to generate
translatable files from the source code. In some cases this can be split into
two parts - one for the extraction generates template (for example gettext POT
is generated using :program:`xgettext`) and then further process merges it into
actual translations (the gettext PO files are updated using
:program:`msgmerge`). You can perform the second step within Weblate and it
will make sure that all pending changes are included prior to this operation.

The second approach can be achieved by using :ref:`api` to force Weblate to
push all pending changes and lock the translation while you are doing changes
on your side.

The script for doing updates can look like this:

.. code-block:: sh

    # Lock Weblate translation
    wlc lock
    # Push changes from Weblate to upstream repository
    wlc push
    # Pull changes from upstream repository to your local copy
    git pull
    # Update translation files, this example is for Django
    ./manage.py makemessages --keep-pot -a
    git commit -m 'Locale updates' -- locale
    # Push changes to upstream repository
    git push
    # Tell Weblate to pull changes (not needed if Weblate follows your repo
    # automatically)
    wlc pull
    # Unlock translations
    wlc unlock

If you have multiple components sharing same repository, you need to lock them
all separately:

.. code-block:: sh

    wlc lock foo/bar
    wlc lock foo/baz
    wlc lock foo/baj

.. note::

    The example uses :ref:`wlc`, which needs configuration (API keys) to be
    able to control Weblate remotely. You can also achieve this using any HTTP
    client instead of wlc, e.g. curl, see :ref:`api`.

.. _github-setup:

Automatically receiving changes from GitHub
+++++++++++++++++++++++++++++++++++++++++++

Weblate comes with native support for GitHub.

If you are using Hosted Weblate, the recommended approach is to install the
`Weblate app <https://github.com/apps/weblate>`_, that way you will get the
correct setup without having to set much up. It can also be used for pushing
changes back.

To receive notifications on every push to a GitHub repository,
add the Weblate Webhook in the repository settings (:guilabel:`Webhooks`)
as shown on the image below:

.. image:: /images/github-settings.png

For the payload URL, append ``/hooks/github/`` to your Weblate URL, for example
for the Hosted Weblate service, this is ``https://hosted.weblate.org/hooks/github/``.

You can leave other values at default settings (Weblate can handle both
content types and consumes just the `push` event).

.. seealso::

   :http:post:`/hooks/github/`, :ref:`hosted-push`

.. _bitbucket-setup:

Automatically receiving changes from Bitbucket
++++++++++++++++++++++++++++++++++++++++++++++

Weblate has support for Bitbucket webhooks, add a webhook
which triggers upon repository push, with destination to ``/hooks/bitbucket/`` URL
on your Weblate installation (for example
``https://hosted.weblate.org/hooks/bitbucket/``).

.. image:: /images/bitbucket-settings.png

.. seealso::

   :http:post:`/hooks/bitbucket/`, :ref:`hosted-push`

.. _gitlab-setup:

Automatically receiving changes from GitLab
+++++++++++++++++++++++++++++++++++++++++++

Weblate has support for GitLab hooks, add a project webhook
with destination to ``/hooks/gitlab/`` URL on your Weblate installation
(for example ``https://hosted.weblate.org/hooks/gitlab/``).

.. seealso::

   :http:post:`/hooks/gitlab/`, :ref:`hosted-push`

.. _pagure-setup:

Automatically receiving changes from Pagure
+++++++++++++++++++++++++++++++++++++++++++

.. versionadded:: 3.3

Weblate has support for Pagure hooks, add a webhook
with destination to ``/hooks/pagure/`` URL on your Weblate installation (for
example ``https://hosted.weblate.org/hooks/pagure/``). This can be done in
:guilabel:`Activate Web-hooks` under :guilabel:`Project options`:

.. image:: /images/pagure-webhook.png

.. seealso::

   :http:post:`/hooks/pagure/`, :ref:`hosted-push`

.. _azure-setup:

Automatically receiving changes from Azure Repos
++++++++++++++++++++++++++++++++++++++++++++++++

.. versionadded:: 3.8

Weblate has support for Azure Repos web hooks, add a webhook for
:guilabel:`Code pushed` event with destination to ``/hooks/azure/`` URL on your
Weblate installation (for example ``https://hosted.weblate.org/hooks/azure/``).
This can be done in :guilabel:`Service hooks` under :guilabel:`Project
settings`.


.. seealso::

   `Web hooks in Azure DevOps manual <https://docs.microsoft.com/azure/devops/service-hooks/services/webhooks>`_,
   :http:post:`/hooks/azure/`, :ref:`hosted-push`

.. _gitea-setup:

Automatically receiving changes from Gitea Repos
++++++++++++++++++++++++++++++++++++++++++++++++

.. versionadded:: 3.9

Weblate has support for Gitea webhooks, add a :guilabel:`Gitea Webhook` for
:guilabel:`Push events` event with destination to ``/hooks/gitea/`` URL on your
Weblate installation (for example ``https://hosted.weblate.org/hooks/gitea/``).
This can be done in :guilabel:`Webhooks` under repository :guilabel:`Settings`.

.. seealso::

   `Webhooks in Gitea manual <https://docs.gitea.io/en-us/webhooks/>`_,
   :http:post:`/hooks/gitea/`, :ref:`hosted-push`

.. _gitee-setup:

Automatically receiving changes from Gitee Repos
++++++++++++++++++++++++++++++++++++++++++++++++

.. versionadded:: 3.9

Weblate has support for Gitee webhooks, add a :guilabel:`WebHook` for
:guilabel:`Push` event with destination to ``/hooks/gitee/`` URL on your
Weblate installation (for example ``https://hosted.weblate.org/hooks/gitee/``).
This can be done in :guilabel:`WebHooks` under repository :guilabel:`Management`.

.. seealso::

   `Webhooks in Gitee manual <https://gitee.com/help/categories/40>`_,
   :http:post:`/hooks/gitee/`, :ref:`hosted-push`

Automatically updating repositories nightly
+++++++++++++++++++++++++++++++++++++++++++

Weblate automatically fetches remote repositories nightly to improve
performance when merging changes later. You can optionally turn this into doing
nightly merges as well, by enabling :setting:`AUTO_UPDATE`.

.. _push-changes:

Pushing changes
---------------

Each translation component can have a push URL set up (see :ref:`component`),
and in that case Weblate will be able to push change to the remote repository.
Weblate can be also be configured to automatically push changes on every commit
(this is default, see :ref:`component`).  If you do not want changes to be
pushed automatically, you can do that manually under :guilabel:`Repository
maintenance` or using API via :option:`wlc push`.

If you are using SSH to push, you will need to have a key without a passphrase
(or use ssh-agent for Django), and the remote server needs to be verified by you
via the admin interface first, otherwise pushing will fail.

The push options differ based on the :ref:`vcs` used, more details are found in that chapter.

.. note::

   You can also enable automatic pushing of changes on commits, this can be done in
   :ref:`component`.

.. seealso::

    See :ref:`vcs-repos` for setting up SSH keys, and :ref:`lazy-commit` for
    info about when Weblate decides to commit changes.

.. _hosted-push:

Pushing changes from Hosted Weblate
+++++++++++++++++++++++++++++++++++

For Hosted Weblate there is a dedicated push user registered on GitHub, Bitbucket
and GitLab (with username :guilabel:`weblate` named
:guilabel:`Weblate push user`). You need to add this user as a collaborator and
give it permission to push to your repository.

The user is added to the repository (in some cases this happens immediately, on
GitHub it typically happens after accepting invitations what happens
automatically every hour), you can configure your component push URL to a ssh
URL of your repository (see :ref:`component`) and enjoy Weblate automatically
pushing changes to your repository.

In case you do not want direct pushes by Weblate, there is support for GitHub,
GitLab pull requests or Gerrit reviews, you can activate these by choosing
`GitHub`, `GitLab` or `Gerrit` as VCS in :ref:`component`.

Protected branches
++++++++++++++++++

If you are using Weblate on protected branch, you can configure it to use pull
requests and perform actual review on the translations (what might be
problematic for languages you do not know). Alternative approach is to to waive
this limitation for the Weblate push user.

For example on GitHub this can be done in the repository configuration:

.. image:: /images/github-protected.png

.. _merge-rebase:

Merge or rebase
---------------

By default, Weblate merges the upstream repository into its own. This is the safest way
in case you also access the underlying repository by other means. In case you don't
need this, you can enable rebasing of changes on upstream, which will produce
history with fewer merge commits.

.. note::

    Rebasing can cause you trouble in case of complicated merges, so carefully
    consider whether or not you want to enable them.

Interacting with others
-----------------------

Weblate makes it easy to interact with others using its API.

.. seealso::

   :ref:`api`

.. _lazy-commit:

Lazy commits
------------

The behaviour of Weblate is to group commits from the same author into one
commit if possible. This greatly reduces the number of commits, however you
might need to explicitly tell it to do the commits in case you want to get the
VCS repository in sync, e.g. for merge (this is by default allowed for the Managers
group, see :ref:`privileges`).

The changes in this mode are committed once any of the following conditions are
fulfilled:

* Somebody else changes an already changed string.
* A merge from upstream occurs.
* An explicit commit is requested.
* Change is older than period defined as :guilabel:`Age of changes to commit` on :ref:`component`.

.. hint::

   Commits are created for every component. So in case you have many components
   you will still see lot of commits. You might utilize
   :ref:`addon-weblate.git.squash` addon in that case.

If you want to commit changes more frequently and without checking of age, you
can schedule a regular task to perform a commit:

.. literalinclude:: ../../weblate/examples/beat-settings.py
    :language: python
    :encoding: utf-8

.. _processing:

Processing repository with scripts
----------------------------------

The way to customize how Weblate interacts with the repository is
:ref:`addons`. Consult :ref:`addon-script` for info on how to execute
external scripts through addons.

