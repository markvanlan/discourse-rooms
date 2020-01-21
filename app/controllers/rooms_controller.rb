module Rooms
  class RoomsController < ApplicationController

    def for_group
      return raise Discourse::NotFound unless guardian.user_is_a_member_of_group?(group)

      respond_to do |format|
        format.html { render 'groups/show' }
        format.json do
          success_json
        end
      end
    end

    def message
      puts params.inspect
      puts "######"
      puts signal_params.inspect
      MessageBus.publish("discourse-room", { message: signal_params.to_h, from: params[:from] } )
    end

    private

    def signal_params
      params.require(:message).permit(:candidate, :sdpMLineIndex, :sdpMidm, desc:{})
    end
  end
end
