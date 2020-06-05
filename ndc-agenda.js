const cheerio = require('cheerio'),
fs = require('file-system'),
fetch = require('node-fetch'),
htmlconvert = require('html-to-markdown')

const fetchAgenda = async () => {
    const pages = ['agenda', 'speakers', 'workshops'],
    talkUrls = [],
    speakerUrls = [],
    workshopUrls = []

    pages.forEach(async (page) => {
        const results = await fetch(`https://ndcoslo.com/${page}`),
        body = await results.text(),
        items = []

        const $ = cheerio.load(body)
        
        if(page == 'agenda') {
            return
            $('section.day').map((i, el) => {
                const day = el.attribs['class'].split(' ')[1],
                dayElements = el.childNodes
                    .filter(c => c.type === 'tag')[0]
                    .children
                    .filter(c => c.type === 'tag')
    
                for (var index = 0; index < dayElements.length; index += 2) {
                    const slotEl = cheerio(dayElements[index]),
                    talkSlot = slotEl.text().split(' - '),
                    startParts = talkSlot[0].split(':'),
                    endParts = talkSlot[1].split(':'),
                    startTime = { hour: Number(startParts[0]), minutes: Number(startParts[1]) },
                    endTime = { hour: Number(endParts[0]), minutes: Number(endParts[1]) }
                    cheerio(dayElements[index + 1]).find('.boxed-talk').each((j, talkEl) => {
                        const $talk = cheerio(talkEl),
                        tags = talkEl.attribs['data-slugs'].split(','),
                        link = talkEl.attribs.href,
                        location = $talk.find('.venue').text(),
                        title = $talk.find('h2').text(),
                        speaker = $talk.find('.speaker').text()
    
                        items.push({
                            title,
                            speaker,
                            location,
                            link,
                            tags,
                            startTime,
                            endTime,
                            day
                        })
    
                        talkUrls.push(link)
                    })
                }
            })

            talkUrls.forEach(async (talk) => {
                const results = await fetch(talk).then(res => res).catch(err => console.log(`error ${talk}`))
                
                if(!results) {
                    console.log(`error on talk ${talk}`)
                    return
                }

                const body = await results.text(),
                details = {
                    link: talk,
                    speakers: []
                },
                talkmatch = talk.match(/https:\/\/ndcoslo.com\/(talk|workshop)\/(.+)\//),
                slug = talkmatch[2],
                type = talkmatch[1]
                
                const $ = cheerio.load(body)
        
                $('.event-wrapper').map((i, el) => {
                    el.children.forEach(a => {
                        if(a.name == 'article') {
                            let abstract = ''
                            a.children.forEach(b => {
                                if(b.attribs && b.attribs.class == 'masthead') {
                                    b.children.forEach(c => {
                                        if(c.name == 'h1') {
                                            details.title = c.children[0].data
                                        }
                                    })
                                }
                                else if(b.attribs && b.attribs.class == 'preamble') {
                                    b.children.forEach(c => {
                                        if(c.name == 'p') {
                                            c.children.forEach(d => {
                                                if(d.type == 'text') {
                                                    abstract = `${abstract}${d.data}`
                                                }
                                                else if(d.name == 'br') {
                                                    abstract = `${abstract}\n`
                                                }
                                            })
                                        }
                                    })
                                }
                                else if(b.attribs && b.attribs.class == 'body video-container') {
                                    b.children.forEach(c => {
                                        if(c.name == 'p') {
                                            abstract = `${abstract}\n\n`

                                            c.children.forEach(d => {
                                                if(d.type == 'text') {
                                                    abstract = `${abstract}${d.data}`
                                                }
                                                else if(d.name == 'br') {
                                                    abstract = `${abstract}\n`
                                                }
                                            })
                                        }
                                    })
                                }
                            })

                            details.abstract = abstract
                        }
                        else if(a.name == 'aside') {
                            a.children.forEach(b => {
                                if(b.attribs && b.attribs.class == 'speakers') {
                                    b.children.forEach(c => {
                                        if(c.name == 'ul') {
                                            c.children.forEach(d => {
                                                if(d.name == 'li') {
                                                    d.children.forEach(e => {
                                                        if(e.name == 'a') {
                                                            let id = e.attribs.href.match(/https:\/\/ndcoslo.com\/speaker\/(.+)(\/)*/)[1]

                                                            details.speakers.push(id)
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                                else if(b.attribs && b.attribs.class == 'details') {
                                    b.children.forEach(c => {
                                        if(c.name == 'p') {
                                            c.children.forEach(d => {
                                                if(d.type == 'text') {
                                                    if(d.next.name == 'span') {
                                                        d.next.children.forEach(e => {
                                                            if(e.type == 'text') {
                                                                details[d.data.toLowerCase().replace(/\s/g, '')] = e.data
                                                            }
                                                        })
                                                    }
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                })

                fs.writeFileSync(`ndc-oslo/${type}s/${slug}.md`, 
                    `---\ntitle: ${details.title}\nlink: ${details.link}\nspeakers: [${details.speakers}]\nday: ${details.day}\ntime: ${details.time}\nvenue: ${details.venue}\n---\n${details.abstract}`)
            })
        }
        else if (page == 'speakers') {
            return
            $('section .msnry-container.grid-container .grid-item').map((i, el) => {
                el.children.forEach(c => {
                    const speaker = {}

                    if(c.name == 'a') {
                        speaker.link = c.attribs.href

                        c.children.forEach(g => {
                            if(g.attribs && g.attribs.class == 'title') {
                                g.children.forEach(a => {
                                    if(a.name == 'h2') {
                                        speaker.name = a.children[0].data
                                    }
                                    else if(a.attribs && !a.attribs.class) {
                                        speaker.role = a.children[0].data
                                    }
                                })
                            }
                            else if(g.attribs && g.attribs.class == 'image') {
                                const image = g.attribs.style.match(/background-image: url\('(\/images\/speaker\/((\w|\d|_|-|\.|ø|ś|å)+))'\);/)

                                if(image) {
                                    speaker.image = `https://ndcoslo.com/${image[1]}`
                                }
                                else {
                                    console.log(g.attribs)
                                }
                            }
                        })

                        items.push(speaker)
                        speakerUrls.push(speaker.link)

                    }
                })
            })

            speakerUrls.forEach(async (speaker) => {
                // if(speaker !== 'https://ndcoslo.com/speaker/amy-kapernick/') {
                //     return
                // }

                const results = await fetch(speaker).then(res => res).catch(err => console.log(`error ${speaker}`))
                
                if(!results) {
                    console.log(`error on speaker ${speaker}`)
                    return
                }

                const body = await results.text(),
                profile = {
                    link: speaker
                },
                slug = speaker.match(/https:\/\/ndcoslo.com\/speaker\/(.+)\//)[1]
                
                const $ = cheerio.load(body)
        
                $('.speaker-wrapper').map((i, el) => {
                    el.children.forEach(c => {
                        if(c.name == 'article') {
                            c.children.forEach(a => {
                                if(a.attribs && a.attribs.class == 'masthead') {
                                    a.children.forEach(e => {
                                        if(e.name == 'h1') {
                                            profile.name = e.children[0].data.replace(/(^(\s+))|((\s+)$)/g, '')

                                            e.children.forEach(f => {
                                                if(f.name == 'span') {
                                                    profile.role = f.children[0].data
                                                }
                                            })
                                        }
                                        else if (e.name == 'img') {
                                            profile.image = e.attribs.src
                                        }
                                        else if(e.name == 'a') {
                                            let social = {}

                                            e.children.forEach(b => {
                                                if(b.name == 'span') {
                                                    social.name = b.children[0].data
                                                }
                                                else if(b.type == 'text') {
                                                    social.value = b.data
                                                }
                                            })

                                            profile.socials = social

                                        }
                                    })
                                }
                                else if (a.attribs && a.attribs.class ==  'preamble') {
                                    a.children.forEach(b => {
                                        if(b.name == 'p') {
                                            let bio = ''
                                            b.children.forEach(p => {
                                                if(p.type == 'text') {
                                                    bio = `${bio}${p.data}`
                                                }
                                                else if(p.name == 'br') {
                                                    bio = `${bio}\n`
                                                }
                                            })
                                            
                                            profile.bio = bio
                                        }
                                    })
                                }
                            })
                        }
                        else if (c.attribs && c.attribs.class == 'events') {
                            let sess = []
                            c.children.forEach(a => {
                                if(a.name == 'ul') {
                                    a.children.forEach(b => {
                                        //sessions
                                        if(b.name == 'li') {
                                            b.children.forEach(d => {
                                                if(d.attribs && d.attribs.class == 'grid-item msnry-item') {
                                                    d.children.forEach(e => {
                                                        if(e.name == 'a') {
                                                            let match = e.attribs.href.match(/https:\/\/ndcoslo.com\/(talk|workshop)\/(.+)\//)
                                                            sess.push(`${match[1]}-${match[2]}`)
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            })

                            profile.sessions = sess
                        }
                    })
        
                    if(!profile) {
                        console.log(speaker)
                        return
                    }

                    fs.writeFileSync(`ndc-oslo/speakers/${slug}.md`, 
                    `---\nname: ${profile.name}\nrole: ${profile.role}\nlink: ${profile.link}\nimage: https://ndcoslo.com${profile.image}${profile.socials && `\n${profile.socials.name.toLowerCase()}: '${profile.socials.value}'`}\nsessions: [${profile.sessions}]\n---\n${profile.bio}`)
                })
            })

        }
        else if (page == 'workshops') {
            $('section.day .msnry-container.grid-container').map((i, el) => {
                el.children.forEach(a => {
                    if(a.name == 'div') {
                        a.children.forEach(b => {
                            if(b.name == 'a') {
                                workshopUrls.push(b.attribs.href)
                            }
                        })
                    }
                })
            })

            workshopUrls.forEach(async (talk) => {
                // if(talk !== 'https://ndcoslo.com/workshop/front-end-web-fundamentals/') {
                //     return
                // }

                const results = await fetch(talk).then(res => res).catch(err => console.log(`error ${talk}`))
                
                if(!results) {
                    console.log(`error on talk ${talk}`)
                    return
                }

                const body = await results.text(),
                details = {
                    link: talk,
                    speakers: []
                },
                talkmatch = talk.match(/https:\/\/ndcoslo.com\/(talk|workshop)\/(.+)\//),
                slug = talkmatch[2],
                type = talkmatch[1]
                
                const $ = cheerio.load(body)
        
                $('.event-wrapper').map((i, el) => {
                    el.children.forEach(a => {
                        if(a.name == 'article') {
                            let abstract = ''
                            a.children.forEach(b => {
                                if(b.attribs && b.attribs.class == 'masthead') {
                                    b.children.forEach(c => {
                                        if(c.name == 'h1') {
                                            c.children.forEach(d => {
                                                if(d.name == 'span') {
                                                    details.title = d.children[0].data.replace('Workshop: ', '')
                                                }
                                            })
                                        }
                                    })
                                }
                                else if(b.attribs && b.attribs.class == 'preamble') {
                                    b.children.forEach(c => {
                                        if(c.name == 'p') {
                                            c.children.forEach(d => {
                                                if(d.type == 'text') {
                                                    abstract = `${abstract}${d.data}`
                                                }
                                                else if(d.name == 'br') {
                                                    abstract = `${abstract}\n`
                                                }
                                            })
                                        }
                                    })
                                }
                                else if(b.attribs && b.attribs.class == 'body video-container') {
                                    b.children.forEach(c => {
                                        if(c.name == 'p') {
                                            abstract = `${abstract}\n\n`

                                            c.children.forEach(d => {
                                                if(d.type == 'text') {
                                                    abstract = `${abstract}${d.data}`
                                                }
                                                else if(d.name == 'br') {
                                                    abstract = `${abstract}\n`
                                                }
                                                else if(d.name == 'b' || d.name == 'strong') {
                                                    abstract = `${abstract}\n### ${d.children[0].data}`
                                                }
                                            })
                                        }
                                        else if(c.name == 'h2') {
                                            abstract = `${abstract}\n## ${c.children[0].data}`
                                        }
                                        else if(c.name == 'ul') {
                                            abstract = `${abstract}\n`

                                            c.children.forEach(d => {
                                                if(d.name == 'li') {
                                                    abstract = `${abstract}\n- ${d.children[0].data}`
                                                }
                                            })

                                            abstract = `${abstract}\n`
                                        }
                                    })
                                }
                            })

                            details.abstract = abstract.replace(/\n\n\n\n/g, '\n\n').replace(/\n\n\n/g, '\n\n')
                        }
                        else if(a.name == 'aside') {
                            a.children.forEach(b => {
                                if(b.attribs && b.attribs.class == 'speakers') {
                                    b.children.forEach(c => {
                                        if(c.name == 'ul') {
                                            c.children.forEach(d => {
                                                if(d.name == 'li') {
                                                    d.children.forEach(e => {
                                                        if(e.name == 'a') {
                                                            let id = e.attribs.href.match(/https:\/\/ndcoslo.com\/speaker\/(.+)(\/)*/)[1]

                                                            details.speakers.push(id)
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                                else if(b.attribs && b.attribs.class == 'details') {
                                    b.children.forEach(c => {
                                        if(c.name == 'p') {
                                            c.children.forEach(d => {
                                                if(d.type == 'text') {
                                                    if(d.next.name == 'span') {
                                                        d.next.children.forEach(e => {
                                                            if(e.type == 'text') {
                                                                details[d.data.toLowerCase().replace(/\s/g, '')] = e.data
                                                            }
                                                        })
                                                    }
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                })

                fs.writeFileSync(`ndc-oslo/${type}s/${slug}.md`, 
                    `---\ntitle: ${details.title}\nlink: ${details.link}\nspeakers: [${details.speakers}]\nday: ${details.date}\nstart: ${details.starttime}\nend: ${details.endtime}\n---\n${details.abstract}`)
            })
        }

        fs.writeFileSync(`ndc-oslo/${page}.json`, JSON.stringify(items))
    })

    


    // const agenda = await fetch('https://ndcoslo.com/agenda'),
    //     agendaBody = await agenda.text(),
    //     talks = [],
    //     talkUrls = []

    
    
    

    // talkUrls.forEach(talk => {
    //     const talk = await fetch(talk),
    //     talkBody = await talk.text()

    //     const $ = 

    // })

    return
}

module.exports = {
	talks: fetchAgenda()
}