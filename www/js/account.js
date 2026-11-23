'use strict';
(function () {
  const L = window.Repair;
  L.accountFields = () => {
    if (L.license.accountEmail) return `<p class="muted small full">${L.t('accountConnected')}: <strong>${L.esc(L.license.accountEmail)}</strong></p>`;
    return `<div class="account-social full"><button class="btn google-button" type="button" data-action="google-account"><img src="assets/google-g.svg" alt="" width="20" height="20"><span>${L.t('continueGoogle')}</span></button></div>
      <p class="muted small full">${L.t('accountHelp')}</p>
      <label class="field full">${L.t('accountEmail')}<input class="input" name="accountEmail" type="email" maxlength="254" autocomplete="email"></label>
      <label class="field full">${L.t('accountPassword')}<span class="password-row"><input class="input" name="accountPassword" id="account-password" type="password" minlength="8" maxlength="128" autocomplete="current-password" required><button class="icon-button password-toggle" type="button" data-password-toggle="account-password" aria-label="${L.t('showPassword')}" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button></span></label>
      <label class="check full"><input type="checkbox" name="createAccount" id="create-koluva-account">${L.t('createAccount')}</label>
      <label class="field full" id="account-confirm-row" hidden>${L.t('confirmAccountPassword')}<span class="password-row"><input class="input" name="accountConfirmPassword" id="account-confirm-password" type="password" minlength="8" maxlength="128" autocomplete="new-password"><button class="icon-button password-toggle" type="button" data-password-toggle="account-confirm-password" aria-label="${L.t('showPassword')}" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button></span></label>
      <label class="check full" id="account-terms-row"><input type="checkbox" name="accountTerms" required>${L.t('acceptAccountTerms')} <button class="link-button" type="button" data-action="account-legal">${L.t('termsAndPrivacy')}</button></label>
      <div class="account-links full"><button class="link-button" type="button" data-action="recover-account">${L.t('forgotPassword')}</button><button class="link-button" type="button" data-action="resend-account">${L.t('resendVerification')}</button></div>`;
  };
  document.addEventListener('change', event => {
    if (!event.target.matches('#create-koluva-account')) return;
    const row = document.getElementById('account-confirm-row'), confirm = document.getElementById('account-confirm-password'), password = document.getElementById('account-password'), links = document.querySelector('.account-links');
    if (!row || !confirm || !password) return;
    row.hidden = !event.target.checked;
    confirm.required = event.target.checked;
    password.autocomplete = event.target.checked ? 'new-password' : 'current-password';
    if (links) links.hidden = event.target.checked;
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-password-toggle]');
    if (!button) return;
    const input = document.getElementById(button.dataset.passwordToggle);
    if (!input) return;
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(visible));
    button.setAttribute('aria-label', L.t(visible ? 'hidePassword' : 'showPassword'));
  });
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-action="recover-account"], [data-action="resend-account"]');
    if (!button) return;
    const email = String(document.querySelector('#license-form [name="accountEmail"]')?.value || '').trim();
    try {
      if (button.dataset.action === 'recover-account') await window.repairHost.account.recover({ email, lang: L.lang() });
      else await window.repairHost.account.resend({ email, lang: L.lang() });
      L.toast(L.t('accountRecoverySent'));
    } catch (error) { L.toast(L.err(error)); }
  });
})();
