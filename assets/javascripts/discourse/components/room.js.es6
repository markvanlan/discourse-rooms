import { scheduleOnce } from "@ember/runloop";
import Component from "@ember/component";
import { observes } from "discourse-common/utils/decorators";
import { ajax } from "discourse/lib/ajax";

export default Component.extend({
  joined: false,
  localVideo: null,
  remoteVideo: null,
  constraints: null,
  configuration: null,
  pc: null,

  didInsertElement() {
    this._super(...arguments);
    const self = this
    this.set("constraints", {audio: true, video: true});
    this.set("configuration", {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]});
    this.set("pc", new RTCPeerConnection(this.configuration))
    this.set("remoteVideo", document.getElementById("remoteVideo"))
    this.pc.onicecandidate = ({candidate}) => {
      if (candidate) {
        self.publish(candidate.toJSON())
      }
    }

    this.pc.onnegotiationneeded = function() {
      if (self.pc.signalingState != "stable") return;

      self.pc.createOffer().then(function(offer) {
        return self.pc.setLocalDescription(offer);
      })
      .then(function() {
        if (self.pc.localDescription) {
          self.publish({desc: self.pc.localDescription.toJSON()})
        }
      })
      .catch((e) => console.log(e));
    }

    this.pc.ontrack = (event) => {
      console.log(event)
      self.remoteVideo.srcObject = event.streams[0];
    };

    this.messageBus.subscribe("discourse-room", data => {
      if (!this.joined || data.from === this.currentUser.id.toString()) return;
      let message = data.message

      try {
        if (message.desc) {
          // if we get an offer, we need to reply with an answer
          if (message.desc.type === 'offer') {
            self.pc.setRemoteDescription(message.desc).then(() => {
              navigator.mediaDevices.getUserMedia(self.constraints).then((stream) => {
                stream.getTracks().forEach((track) =>
                  self.pc.addTrack(track, stream));
              })
            }).then(() => {
              self.pc.createAnswer().then((answer) => {
                self.pc.setLocalDescription(answer).then(() => {
                  self.publish(self.pc.localDescription.toJSON())
                })
              })
            })
          } else if (message.desc.type === 'answer') {
            self.pc.setRemoteDescription(message.desc);
          } else {
            console.log('Unsupported SDP type.');
          }
        } else if (message.candidate) {
          let candidate = new RTCIceCandidate(message)
          self.pc.addIceCandidate(candidate);
        }
      } catch (err) {
        console.error(err);
      }
    })
  },

  publish(data) {
    ajax(
      `/g/:group_name/room.json`,
      { data: { message: data, from: this.currentUser.id},
         type: 'post' }
      )
  },

  actions: {
    startVideo() {
      console.log('Requesting local stream');
      const self = this
      navigator.mediaDevices.getUserMedia({audio: true, video: true})
      .then(function(stream) {
        console.log('Received local stream');
        const localVideo =  document.getElementById("localVideo")
        localVideo.srcObject = stream
        stream.getTracks().forEach((track) => self.pc.addTrack(track, stream));
        self.set("localVideo", localVideo)
        self.set("joined", true)
      })
      .catch(function(err) {
        console.log(err)
      });
    }
  }
});

