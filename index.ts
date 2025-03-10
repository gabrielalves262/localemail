import fs from 'node:fs'
import path from 'node:path'

type SendMailReturn = {
  success: true
} | {
  success: false
  error: MailError
}

export type Address = {
  name: string
  address: string
}

export type MailError = {
  message: string
  code: string
}

export type MailOptions = {
  from: string | Address
  to: string | Address | string[] | Address[]
  subject?: string
  text?: string
  html?: string

  // Simulate
  simulateOptions?: {
    /** in ms */
    delay?: number
    error?: string | MailError,
  }
}

type LocalemailOptions = {
  /** Output dir
   * 
   * @default './localemail'
   */
  outDir?: string

  /** The name of the file that will be created in outDir/email/file
   * 
   * @default '%ts_%s' (%ts = timestamp, %s = subject)
   * 
   * %ts = timestamp
   * 
   * %s = subject
   * 
   * %d = date (YYYY-MM-DD)
   * 
   * %t = time (HH-mm-ss)
   * 
   * %dt = date and time (YYYY-MM-DDTHH-mm-ss)
   * 
   * %fn = from name
   * 
   * %fa = from address
   * 
   * @examples 
   * 
   * '%ts_%s' => 1630000000_hello

   * '%s' => hello
   * 
   * '%ts' => 1630000000
   * 
   * '%d_%s' => 2021-08-27_hello
   * 
   * '%dt_%s' => 2021-08-27_00-00-00_hello
   * 
   * '%d_%t_%s' => 2021-08-27_11-45-32_hello
   * 
   * '%t_%s' => 11-45-32_hello
   * 
   * '[%d %t] %s' => [2021-08-27 11-45-32] hello
   * 
   * '%fn_%fa_%s' => John Due_john.due@mail.com_hello
  */
  fileName?: string

  ignoreCreateFiles?: {
    /** If true, the file (.txt) wont be created 
     * 
     * @default false
    */
    text?: boolean

    /** If true, the file (.html) wont be created 
     * 
     * @default false
    */
    html?: boolean

    /** If true, the file (.json) wont be created 
     * 
     * @default true
    */
    json?: boolean
  }
}

const replaceMatch = (match: string, replaceStr: string) => {
  const num: number = parseInt(match.match(/\d+/)?.[0] || '-1');
  if (!num) return replaceStr;
  return replaceStr.slice(0, num);
}

class Localemail {

  constructor(private options: Required<LocalemailOptions>) {}

  readonly send = async (options: MailOptions): Promise<SendMailReturn> => {
    return new Promise<SendMailReturn>((resolve, reject) => {
      setTimeout(() => {
        if (!!options.simulateOptions?.error) {
          if (typeof options.simulateOptions.error === 'string') {
            reject({ message: options.simulateOptions.error, code: 'SIMULATE_ERROR' })
            return
          } else {
            reject(options.simulateOptions.error)
            return
          }
        }

        // validate from 
        if (typeof options.from === 'string' && !this.__validateEmail(options.from)) {
          reject({ message: `Invalid email address: ${options.from}`, code: 'INVALID_EMAIL' })
          return
        } else if (typeof options.from !== 'string' && !this.__validateEmail(options.from.address)) {
          reject({ message: `Invalid email address: ${options.from.address}`, code: 'INVALID_EMAIL' })
          return
        }

        // validate to
        if (Array.isArray(options.to)) {
          for (const t of options.to) {
            if (typeof t === 'string' && !this.__validateEmail(t)) {
              reject({ message: `Invalid email address: ${t}`, code: 'INVALID_EMAIL' })
              return
            } else if (typeof t !== 'string' && !this.__validateEmail(t.address)) {
              reject({ message: `Invalid email address: ${t.address}`, code: 'INVALID_EMAIL' })
              return
            }
          }
        } else {
          if (typeof options.to === 'string' && !this.__validateEmail(options.to)) {
            reject({ message: `Invalid email address: ${options.to}`, code: 'INVALID_EMAIL' })
            return
          } else if (typeof options.to !== 'string' && !this.__validateEmail(options.to.address)) {
            reject({ message: `Invalid email address: ${options.to.address}`, code: 'INVALID_EMAIL' })
            return
          }
        }

        const outDir = path.resolve(this.options.outDir)

        // outDir exists
        if (!fs.existsSync(outDir))
          fs.mkdirSync(outDir, { recursive: true })

        // create to folders
        const addrList = this.__createToFolders(Array.isArray(options.to) ? options.to : [options.to])

        for (const addr of addrList) {
          const fileName = this.options.fileName
            .replace(/%ts(\{\d+\})?/g, m => replaceMatch(m, Math.round(Date.now() / 1000).toString()))
            .replace(/%dt(\{\d+\})?/g, m => replaceMatch(m, new Date().toISOString().replace(/:/g, '-').split('.')[0]))
            .replace(/%fn(\{\d+\})?/g, m => replaceMatch(m, typeof options.from === 'string' ? '' : options.from.name))
            .replace(/%fa(\{\d+\})?/g, m => replaceMatch(m, typeof options.from === 'string' ? options.from : options.from.address))
            .replace(/%d(\{\d+\})?/g, m => replaceMatch(m, new Date().toISOString().split('T')[0]))
            .replace(/%t(\{\d+\})?/g, m => replaceMatch(m, new Date().toISOString().split('T')[1].replace(/:/g, '-').split('.')[0]))
            .replace(/%s(\{\d+\})?/g, m => replaceMatch(m, options.subject || 'no-subject'))

          const filePath = path.resolve(outDir, addr.address, fileName)

          if (!this.options.ignoreCreateFiles?.text && options.text)
            fs.writeFileSync(`${filePath}.txt`, options.text)

          if (!this.options.ignoreCreateFiles?.html && options.html)
            fs.writeFileSync(`${filePath}.html`, options.html)

          if (!this.options.ignoreCreateFiles?.json) {
            fs.writeFileSync(`${filePath}.json`, JSON.stringify({
              ...options,
              from: typeof options.from === 'string' ? { name: "", address: options.from } : options.from,
              to: addr,
            }, null, 2))
          }

          resolve({ success: true })
        }

      }, options.simulateOptions?.delay || 1)
    })
  }

  private __createToFolders = (to: (string | Address)[]): Address[] => {
    const addrList: Address[] = []
    to.forEach((t) => {
      const addr = typeof t === 'string' ? t : t.address
      const outDir = path.resolve(this.options.outDir, addr)
      if (!fs.existsSync(outDir))
        fs.mkdirSync(outDir, { recursive: true })

      addrList.push({ address: addr, name: typeof t === 'string' ? "" : t.name })
    })

    return addrList
  }

  private __validateEmail = (addr: string) => {
    return /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/.test(addr)
  }


}

export default (opt: LocalemailOptions = {}) => {
  const {
    outDir = "./localemail",
    fileName = "%ts_%s",
    ignoreCreateFiles: {
      text = false,
      html = false,
      json = true,
    } = {}
  } = opt
  return new Localemail({
    outDir,
    fileName,
    ignoreCreateFiles: { text, html, json }
  })
}