/*
 * Contact cards. Rows: overline | initials (or photo) | name | role / e-mail | actions (links)
 */
const MAIL = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 4.5L8 9l5.5-4.5" stroke="currentColor" stroke-width="1.5"/></svg>';

export default function decorate(block) {
  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    const [overline, avatar, name, role, actions] = [...row.children];
    const li = document.createElement('li');
    li.className = 'contact-card';
    li.innerHTML = '<p class="overline"></p><div class="who"><span class="avatar" aria-hidden="true"></span><div><p class="name"></p><p class="role"></p></div></div>';
    li.querySelector('.overline').textContent = overline ? overline.textContent.trim() : '';
    const pic = avatar && avatar.querySelector('picture');
    if (pic) li.querySelector('.avatar').append(pic);
    else li.querySelector('.avatar').textContent = avatar ? avatar.textContent.trim() : '';
    li.querySelector('.name').textContent = name ? name.textContent.trim() : '';
    li.querySelector('.role').textContent = role ? role.textContent.trim() : '';
    if (actions) {
      const group = document.createElement('div');
      group.className = 'button-group';
      actions.querySelectorAll('a').forEach((a) => {
        a.className = `button m ${a.closest('strong') || a.classList.contains('primary') ? 'primary' : 'secondary'}`;
        if (a.getAttribute('href').startsWith('mailto:')) {
          a.classList.add('mail');
          a.insertAdjacentHTML('beforeend', MAIL);
        }
        group.append(a);
      });
      li.append(group);
    }
    list.append(li);
  });
  block.textContent = '';
  block.append(list);
}
