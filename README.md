# LocalEmail

A simple library to save files locally as email instead of sending them to the recipient. The library creates a folder locally and saves the files in .html, .txt, and .json formats.

## Installation

```bash
npm install localemail
```

## Usage

```javascript
import Mail from 'localemail'

const mail = Mail();

mail.send({
  to: 'john.due@mail.com',
  from: 'tom_cook@mail.com',
  subject: 'Hello',
  text: 'Hello World',
  html: '<h1>Hello World</h1>',
})
  .then(() => { console.log('Email sent') })
  .catch((err) => { console.error(err) })
```

## Mail Properties

```javascript
const mail = Mail({
  ...props
});
```

| Property | Type | Description |
| --- | --- | --- |
| `outDir` | `string` | The directory where the email files will be saved. Default: `./localemail` |
| `fileName` | `string` | The name of the email file. Default: `%ts_%s`. See more about in [File Name Format](#file-name-format) |
| `ignoreCreateFiles` | `object` | Ignore the creation of files. Default: `{ html: false, text: false, json: true }` |

#### File Name Format

| Placeholder | Description |
| --- | --- |
| `%ts` | The current timestamp |
| `%t` | The current time (HH-mm-ss) |
| `%d` | The current date (YYYY-MM-DD) |
| `dt` | The current date and time (YYYY-MM-DDTHH-mm-ss) |
| `%s` | The subject of the email |
| `%fa` | The from email address |
| `%fn` | The from name |

You can add `{num}` after the placeholder to limit the length of the string. For example, `%s{10}` will limit the subject to 10 characters.

