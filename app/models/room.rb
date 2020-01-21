# frozen_string_literal: true

class Room < ActiveRecord::Base
  belongs_to :parent, polymorphic: true
end

